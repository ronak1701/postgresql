# PostgreSQL Part 3: Advanced Concepts, Normalization & Indexing

## 1. Stored Procedure
A stored procedure is a prepared SQL code that you can save, so the code can be reused over and over again. Unlike functions, procedures can commit or rollback transactions inside their body. They don't typically return values like functions do, but they can use `INOUT` parameters to return results.

### Example
Let's create a stored procedure to transfer money between two accounts.
```sql
CREATE OR REPLACE PROCEDURE transfer_money(
    sender_id INT,
    receiver_id INT,
    amount DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Deduct from sender
    UPDATE accounts 
    SET balance = balance - amount 
    WHERE id = sender_id;

    -- Add to receiver
    UPDATE accounts 
    SET balance = balance + amount 
    WHERE id = receiver_id;

    -- Commit is optional here as it can be called within a transaction block
    COMMIT;
END;
$$;

-- Calling the procedure
CALL transfer_money(1, 2, 500.00);
```

## 2. User Defined Function (UDF)
Functions are reusable blocks of code that return a single value or a table (set of rows). They cannot manage transactions (like `COMMIT` or `ROLLBACK` inside the function).

### Example
A function to calculate the total salary of a department.
```sql
CREATE OR REPLACE FUNCTION get_total_salary(dept_name VARCHAR)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    total_salary NUMERIC;
BEGIN
    SELECT SUM(salary) INTO total_salary
    FROM employees
    WHERE department = dept_name;
    
    RETURN COALESCE(total_salary, 0);
END;
$$;

-- Calling the function
SELECT get_total_salary('Engineering');
```

## 3. WINDOW Functions
Window functions perform a calculation across a set of table rows that are somehow related to the current row. Unlike aggregate functions (like `GROUP BY`), window functions do not cause rows to become grouped into a single output row — the rows retain their separate identities.

The window is defined using the `OVER()` clause, which can contain:
- `PARTITION BY`: Divides rows into groups (windows).
- `ORDER BY`: Specifies the order of rows within each partition.

Below are the most common and useful Window Functions in PostgreSQL categorized by their use case.

### A. Aggregate Window Functions
These are standard aggregate functions applied over a window.
- **`SUM()`, `AVG()`, `COUNT()`, `MIN()`, `MAX()`**

```sql
SELECT 
    employee_name, 
    department, 
    salary,
    -- Calculate average salary per department without collapsing rows
    AVG(salary) OVER (PARTITION BY department) AS avg_dept_salary,
    -- Running total of salaries for the entire company, ordered by hire date
    SUM(salary) OVER (ORDER BY hire_date) AS running_total_salary
FROM employees;
```

### B. Ranking Window Functions
Assigns a rank or row number to each row within a partition.

**1. `ROW_NUMBER()`**
Assigns a unique, sequential integer to each row within its partition, regardless of duplicates.
```sql
SELECT 
    employee_name, salary,
    ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num
FROM employees;
```

**2. `RANK()` vs `DENSE_RANK()`**
- `RANK()`: Assigns a rank to each row. If values are identical, they get the same rank, and the next rank is skipped (e.g., 1, 2, 2, 4).
- `DENSE_RANK()`: Similar to `RANK()`, but does not skip the next rank (e.g., 1, 2, 2, 3).
```sql
SELECT 
    employee_name, department, salary,
    RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rank,
    DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dense_rank
FROM employees;
```

**3. `NTILE(n)`**
Divides the sorted rows in a partition into `n` roughly equal groups or "buckets".
```sql
SELECT 
    employee_name, salary,
    -- Divides employees into 4 salary quartiles (1 = lowest, 4 = highest)
    NTILE(4) OVER (ORDER BY salary ASC) AS salary_quartile
FROM employees;
```

### C. Value (Positional) Window Functions
Accesses data from previous, next, or specific rows within the same window.

**1. `LAG()` and `LEAD()`**
- `LAG()`: Accesses data from a *previous* row in the partition.
- `LEAD()`: Accesses data from a *subsequent* row in the partition.
Great for calculating year-over-year or month-over-month differences!
```sql
SELECT 
    employee_name, hire_date, salary,
    -- Get the salary of the person hired just before this employee
    LAG(salary) OVER (ORDER BY hire_date) AS prev_hired_salary,
    -- Get the salary of the person hired just after this employee
    LEAD(salary) OVER (ORDER BY hire_date) AS next_hired_salary,
    -- Calculate salary difference between current employee and previous hire
    salary - LAG(salary) OVER (ORDER BY hire_date) AS diff_from_prev
FROM employees;
```

**2. `FIRST_VALUE()`, `LAST_VALUE()`, and `NTH_VALUE()`**
- `FIRST_VALUE()`: Returns the first value in the window frame.
- `LAST_VALUE()`: Returns the last value in the window frame.
- `NTH_VALUE(expr, n)`: Returns the value of the *n*-th row in the window frame.
```sql
SELECT 
    employee_name, department, salary,
    -- Highest salary in the department
    FIRST_VALUE(employee_name) OVER (
        PARTITION BY department ORDER BY salary DESC
    ) AS highest_paid_employee,
    -- 2nd Highest salary in the department
    NTH_VALUE(employee_name, 2) OVER (
        PARTITION BY department ORDER BY salary DESC
    ) AS second_highest_paid_employee
FROM employees;
```
Note: For `LAST_VALUE()`, you often need to define the window frame explicitly (e.g., `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`) to get the absolute last value of the partition.

## 4. CTE (Common Table Expression)
A CTE is a temporary, named result set that you can reference within a `SELECT`, `INSERT`, `UPDATE`, or `DELETE` statement. They are great for breaking down complex queries, making them more readable.

### Example
Find all employees earning the maximum salary in their respective departments.
```sql
WITH max_salary_each_dept AS (
    SELECT department, MAX(salary) AS max_salary 
    FROM employees 
    GROUP BY department
)
SELECT e.employee_name, e.department, e.salary
FROM employees e
JOIN max_salary_each_dept ms 
  ON ms.department = e.department 
 AND e.salary = ms.max_salary;
```

## 5. TRIGGERS
A trigger is a database object that automatically executes a specified function when an event (INSERT, UPDATE, DELETE, TRUNCATE) occurs on a table or view.

### Example
Let's create an audit table and a trigger to log every time an employee's salary is updated.

```sql
-- Create an audit table
CREATE TABLE employee_audit (
    id SERIAL PRIMARY KEY,
    employee_id INT,
    old_salary NUMERIC,
    new_salary NUMERIC,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. Create the function that the trigger will execute
CREATE OR REPLACE FUNCTION log_salary_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.salary <> OLD.salary THEN
        INSERT INTO employee_audit (employee_id, old_salary, new_salary)
        VALUES (OLD.id, OLD.salary, NEW.salary);
    END IF;
    RETURN NEW;
END;
$$;

-- 2. Create the trigger
CREATE TRIGGER salary_change_trigger
AFTER UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION log_salary_change();

-- Testing the trigger
UPDATE employees SET salary = salary * 1.10 WHERE department = 'Sales';
```

## 6. Normalization
Normalization is the process of organizing data in a database to reduce redundancy and improve data integrity. It involves dividing large tables into smaller, related tables.

### Normal Forms
1.  **1NF (First Normal Form):** Each column must contain atomic (indivisible) values. No repeating groups or arrays.
2.  **2NF (Second Normal Form):** Must be in 1NF, and all non-key attributes must be fully functionally dependent on the primary key (no partial dependencies).
3.  **3NF (Third Normal Form):** Must be in 2NF, and no transitive dependencies exist (non-primary key columns should NOT depend on other non-primary key columns).

### Real World Example (3NF E-commerce Database)
```sql
-- Instead of one giant table with users, orders, and products, we split them:
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY, 
    name VARCHAR(100), 
    email VARCHAR(150) UNIQUE
);

CREATE TABLE products (
    product_id SERIAL PRIMARY KEY, 
    product_name VARCHAR(200), 
    price NUMERIC(10, 2)
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY, 
    user_id INT REFERENCES users(user_id), 
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(order_id), 
    product_id INT REFERENCES products(product_id), 
    qty INT
);
```

## 7. Indexing
Indexes are special lookup tables that the database search engine can use to speed up data retrieval. Simply put, an index is a pointer to data in a table, much like an index in a book.

### Types of Indexes & Examples

**1. B-Tree Index (Default)**
Used for most operators (`<`, `<=`, `=`, `>=`, `>`, `BETWEEN`, `IN`, `IS NULL`).
```sql
-- Creating an index on the email column for faster lookups
CREATE INDEX idx_users_email ON users(email);
```

**2. Hash Index**
Only useful for equality `=` comparisons. Rarely faster than B-Tree, but sometimes used.
```sql
CREATE INDEX idx_users_email_hash ON users USING HASH (email);
```

**3. Unique Index**
Ensures data uniqueness and creates a B-Tree index automatically.
```sql
CREATE UNIQUE INDEX idx_unique_email ON users(email);
```

**4. Composite / Multi-column Index**
Useful when you frequently filter by multiple columns together.
```sql
CREATE INDEX idx_users_name_email ON users(name, email);
```

## 8. Transactions in PostgreSQL
A transaction is a single unit of work that consists of one or more database operations. It follows the **ACID** properties: **A**tomicity, **C**onsistency, **I**solation, **D**urability.

### Example
If updating an employee fails, we can roll back the entire transaction.

**Scenario A: Committing a Transaction**
```sql
BEGIN; -- or START TRANSACTION;

UPDATE accounts SET balance = balance - 100 WHERE name = 'Alice';
UPDATE accounts SET balance = balance + 100 WHERE name = 'Bob';

COMMIT; -- Saves the changes permanently
```

**Scenario B: Rolling Back a Transaction**
```sql
BEGIN;

UPDATE employees SET fname = 'Ronak' WHERE fname = 'Arjun';

-- If we realize this was a mistake before committing:
ROLLBACK; -- Undoes the changes made in this transaction
```

## 9. Connecting PostgreSQL in a Node.js Application
To connect to a PostgreSQL database from a Node.js application, we typically use the `pg` (node-postgres) package.

### 1. Installation
```bash
npm install pg
```

### 2. Implementation using Client
The `Client` class is good for a simple, single-connection script.
```javascript
const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'my_database',
  password: 'my_password',
  port: 5432,
});

async function connectToDb() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL successfully!');

    const res = await client.query('SELECT NOW()');
    console.log('Current Time:', res.rows[0]);

  } catch (err) {
    console.error('Connection error', err.stack);
  } finally {
    await client.end();
  }
}

connectToDb();
```

### 3. Implementation using Pool (Recommended for Web Servers)
Connection pooling is better for applications like Express servers because it reuses existing active connections instead of opening and closing a new connection for every query.

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'my_database',
  password: 'my_password',
  port: 5432,
  max: 20, // Max number of connections in the pool
  idleTimeoutMillis: 30000 // Close idle clients after 30 seconds
});

async function getUsers() {
  try {
    // pool.query automatically checks out a client, runs the query, and releases the client
    const res = await pool.query('SELECT * FROM users WHERE active = $1', [true]);
    console.log(res.rows);
  } catch (err) {
    console.error('Query error', err.stack);
  }
}

getUsers();
```
