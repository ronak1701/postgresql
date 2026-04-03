# Database Concurrency, Isolation Levels, and MVCC

This guide covers fundamental database concepts related to concurrency control, focusing on Locks, Deadlocks, Isolation Levels, and PostgreSQL's implementation of Multiversion Concurrency Control (MVCC).

## 1. Locks and Deadlocks

### What are Locks?
Locks are mechanisms used by Database Management Systems (DBMS) to ensure data integrity and consistency when multiple transactions happen concurrently. If transaction A is modifying a row, it obtains a lock on that row to prevent transaction B from modifying the same row simultaneously.

### What is a Deadlock?
A deadlock occurs when two or more transactions are waiting for one another to release locks, creating a circular dependency where none of the transactions can proceed. The DBMS usually detects this state and automatically rolls back one of the transactions (the "victim") to resolve the deadlock.

### Practical Deadlock Demonstration

Imagine we have an `accounts` table:

```sql
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    balance NUMERIC
);

INSERT INTO accounts (name, balance) VALUES ('Alice', 1000), ('Bob', 1000);
```

**Transaction A (T1):**
```sql
BEGIN;
-- T1 locks account 1
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
```

**Transaction B (T2):**
```sql
BEGIN;
-- T2 locks account 2
UPDATE accounts SET balance = balance - 100 WHERE id = 2;
```

**Transaction A (T1) continuation:**
```sql
-- T1 attempts to lock account 2, but it's locked by T2. T1 waits.
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
```

**Transaction B (T2) continuation:**
```sql
-- T2 attempts to lock account 1, but it's locked by T1. T2 waits.
-- DEADLOCK!
UPDATE accounts SET balance = balance + 100 WHERE id = 1;
```

**Result:**
The database engine will detect the deadlock and abort one transaction with an error like:
`ERROR: deadlock detected`
The other transaction will then complete successfully. You can then `COMMIT` the successful transaction, but you must `ROLLBACK` and retry the aborted one in your application code.

---

## 2. Isolation Levels in DBMS

Isolation is the `I` in the ACID properties. It dictates how transaction integrity is visible to other users and systems. Before looking at the isolation levels, we need to understand the read phenomena they prevent:

*   **Dirty Read:** A transaction reads data written by a concurrent uncommitted transaction.
*   **Non-Repeatable Read:** A transaction re-reads data it has previously read and finds that the data has been modified by another committed transaction.
*   **Phantom Read:** A transaction re-executes a query returning a set of rows that satisfy a search condition and finds that the set of rows has changed due to another recently-committed transaction (e.g., new rows were inserted or deleted).

### The Four Standard Isolation Levels

1.  **Read Uncommitted:** The lowest level. Transactions can see uncommitted data from other transactions. *(Note: PostgreSQL treats this identically to Read Committed; it doesn't allow true dirty reads intrinsically).*
2.  **Read Committed:** A transaction can only see data committed before it began executing its query. It prevents dirty reads. **This is the default isolation level in PostgreSQL.**
3.  **Repeatable Read:** Ensures that if a row is read twice in the same transaction, its values will be the same, preventing non-repeatable reads. 
4.  **Serializable:** The strictest level. It ensures that concurrent execution of transactions produces the exact same outcome as if they were executed sequentially. It prevents dirty reads, non-repeatable reads, and phantom reads.

### Practical Example: Read Committed vs Repeatable Read

```sql
-- T1 Setup
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
SELECT balance FROM accounts WHERE id = 1; -- Returns 1000

-- T2 Happens Concurrently in another terminal
BEGIN;
UPDATE accounts SET balance = 500 WHERE id = 1;
COMMIT;

-- T1 Re-reads
SELECT balance FROM accounts WHERE id = 1; -- Returns 500! (Non-repeatable read occurred)
COMMIT;
```

**If T1 was using `REPEATABLE READ`:**
```sql
-- T1 Setup
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
SELECT balance FROM accounts WHERE id = 1; -- Returns 1000

-- T2 Happens Concurrently
BEGIN;
UPDATE accounts SET balance = 500 WHERE id = 1;
COMMIT;

-- T1 Re-reads
SELECT balance FROM accounts WHERE id = 1; -- Returns 1000 (Non-repeatable read prevented because T1 uses its MVCC snapshot!)
COMMIT;
```

---

## 3. PostgreSQL Internals: MVCC (Multiversion Concurrency Control)

Traditional databases heavily rely on locks to provide isolation. However, excessive locking causes performance bottlenecks because readers end up blocking writers, and writers block readers. 

PostgreSQL solves this using **MVCC (Multiversion Concurrency Control)**. 

**Key Concept in MVCC:** 
> Readers *never* block writers, and writers *never* block readers. 

Instead of aggressively locking rows, PostgreSQL maintains multiple versions of a row. When you update a row, PostgreSQL doesn't overwrite it. Instead, it marks the old row as "dead" (to be cleaned up later) and inserts a completely new version of the row. Transactions use snapshot isolation to see the specific version of the database that corresponds to when the transaction started.

---

## 4. PostgreSQL MVCC: A Hands-On Exploration

To truly understand how MVCC works under the hood, let's look at the hidden system columns PostgreSQL adds to every row:
*   `xmin`: The Transaction ID (TXID) that created/inserted the row.
*   `xmax`: The TXID that deleted or updated the row (`0` if not deleted/updated).
*   `ctid`: The physical location of the row version within its table (block number, tuple index).

### Step 1: Insert a row and inspect system columns

```sql
CREATE TABLE products ( id SERIAL PRIMARY KEY, name VARCHAR(50), price NUMERIC );
INSERT INTO products (name, price) VALUES ('Laptop', 1000);

-- Let's assume this was done by Transaction 1050
SELECT xmin, xmax, ctid, * FROM products;
```
**Conceptual Output:**
| xmin | xmax | ctid | id | name | price |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1050 | 0 | (0,1) | 1 | Laptop | 1000 |

*   `xmin = 1050`: Transaction 1050 inserted this row.
*   `xmax = 0`: The row hasn't been deleted or updated.
*   `ctid = (0,1)`: It's the first tuple (row) on page 0 on disk.

### Step 2: Update the row

```sql
-- Assume this is run by Transaction 1051
UPDATE products SET price = 1200 WHERE id = 1;

SELECT xmin, xmax, ctid, * FROM products;
```
**Conceptual Output (Standard view):**
| xmin | xmax | ctid | id | name | price |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1051 | 0 | (0,2) | 1 | Laptop | 1200 |

**Where did the old row go?** 
By default, PostgreSQL hides dead rows. However, conceptually, the table now contains TWO versions of the row on disk:

1.  **Old version (Dead tuple):** `xmin` = 1050, `xmax` = 1051 (Marked as deleted by TXID 1051), `ctid` = (0,1)
2.  **New version (Live tuple):** `xmin` = 1051, `xmax` = 0, `ctid` = (0,2)

When a concurrent transaction queries the table, PostgreSQL looks at the transaction ID that created its snapshot. If the transaction ID is older, it looks at older versions to provide the exact data that existed when its snapshot was created.

### Step 3: Deleting a row

```sql
-- Assume executed by Transaction 1052
DELETE FROM products WHERE id = 1;
```
The row isn't originally removed from the disk immediately. Instead, its `xmax` is simply updated to the current Transaction ID (`1052`). Active transactions running beforehand will still see the row until they finish, because their snapshot predates `1052`.

### Step 4: The Role of VACUUM

Because `UPDATE`s and `DELETE`s leave "dead tuples" lying around on disk, the fundamental drawback of MVCC is table bloat. If we perform one million updates, we end up with one million dead rows taking up disk space and slowing down queries.

This is exactly why PostgreSQL relies on the `VACUUM` process:
`VACUUM` scans the tables, identifies dead tuples that are no longer visible to *any* active transaction, and marks that disk space as available for future `INSERT`s or `UPDATE`s. PostgreSQL runs an **autovacuum** daemon in the background to handle this intelligently in almost all modern Postgres deployments.
