# 🐘 PostgreSQL: Overview and CRUD

Welcome to the comprehensive guide on PostgreSQL covering installation, basic concepts, CRUD operations, datatypes, and constraints!

---

## 🎯 Introduction to PostgreSQL Course

**PostgreSQL** is a powerful, open-source object-relational database system with over 35 years of active development that has earned it a strong reputation for reliability, feature robustness, and performance. In this course, we will explore database management starting from basic queries up to advanced features.

## 🗄️ What is database?

A **database** is an organized collection of structured information, or data, typically stored electronically in a computer system. The data is usually modeled in rows and columns within a series of tables to make processing and data querying efficient.

_Example:_ A phonebook, a hotel reservation system, or an e-commerce product catalog.

## 🆚 Database vs DBMS

| Feature        | Database                                             | DBMS Server                                                      |
| :------------- | :--------------------------------------------------- | :--------------------------------------------------------------- |
| **Definition** | Real storage of data (files on disk).                | Software used to create, manage, and interact with the database. |
| **Examples**   | A folder containing user data files (`.dat`, `.db`). | PostgreSQL, MySQL, Oracle, MongoDB.                              |

## 📊 What is RDBMS?

**RDBMS** stands for **R**elational **D**atabase **M**anagement **S**ystem.

- It stores data in a structured format, using tables composed of **rows** and **columns**.
- Data elements have a pre-defined relationship (using primary keys and foreign keys).
- It relies on **SQL** (Structured Query Language) for querying and maintaining the database.

---

## ⚙️ PostgreSQL Installation

### 🪟 Postgres Installation on Windows

1. Download the installer from the [PostgreSQL Official Website](https://www.postgresql.org/download/windows/).
2. Run the executable and follow the wizard instructions.
3. Make sure to remember the **postgres** superuser password you set during installation!
4. It comes bundled with `pgAdmin` (a GUI tool) and `SQL Shell (psql)` (a command-line tool).
   > **Pro Tip:** Post-installation, you can open SQL Shell (`psql`) or the terminal and run:
   >
   > ```bash
   > psql -U postgres
   > ```
   >
   > _(It will prompt for the password you created)._

### 🍎 Postgres Installation on MAC

The easiest way is using [Postgres.app](https://postgresapp.com/) (provides a nice UI in the menu bar) or via Homebrew:

```bash
brew install postgresql
# Start the background service
brew services start postgresql
```

### 🐧 Postgres Installation on Linux

Using the `apt` package manager:

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
# Switch to the default postgres user
sudo -i -u postgres
# Access the interactive SQL CLI
psql
```

---

## 🏛️ Database vs Schema vs Table

- **Database:** The highest level logic container. You can have multiple independent databases in a PostgreSQL server.
- **Schema:** A namespace inside a database (like a folder) that contains tables, views, etc. (The default schema is named `public`).
- **Table:** The lowest level where data is actually stored in rows and columns.

---

# 🛠️ Section 1 - Database and CRUD

## 🗃️ Database Create, DROP, List & Switch

- **List All Databases:**

  ```sql
  \l
  -- OR
  \list
  -- OR using SQL query
  SELECT datname FROM pg_database;
  ```

- **Create a Database:**

  ```sql
  CREATE DATABASE test;
  ```

- **Switch/Connect to a Database:**

  ```sql
  \c <database_name>
  -- OR
  \connect <database_name>
  ```

- **Drop/Delete a Database:**
  ```sql
  DROP DATABASE test;
  ```

## 🔄 What is CRUD

**CRUD** refers to the four basic operations performed in a database to manage persistent storage:

- **C**reate $\rightarrow$ Insert new data (`INSERT`)
- **R**ead $\rightarrow$ Fetch existing data (`SELECT`)
- **U**pdate $\rightarrow$ Modify existing data (`UPDATE`)
- **D**elete $\rightarrow$ Remove data (`DELETE`)

## 📝 CREATE Table

Let's create a blueprint for our data:

```sql
CREATE TABLE person(
    id INT,
    name VARCHAR(100),
    city VARCHAR(100)
);
```

## ➕ INSERT Data

Adding records into the created table:

```sql
-- Single insertion
INSERT INTO person(id, name, city)
VALUES (1, 'Rahul', 'Ahmedabad');

-- Multiple insertions at once
INSERT INTO person(id, name, city)
VALUES
    (2, 'Atrik', 'Kapadvanj'),
    (3, 'Ronak', 'Ahmedabad');
```

## 📖 READING (SELECT)

Retrieving data from the table:

```sql
-- Retrieve everything (all columns and rows)
SELECT * FROM person;

-- Retrieve specific columns
SELECT name, city FROM person;
```

## ✏️ UPDATING

Modifying existing data dynamically based on a condition:

```sql
UPDATE person
SET city = 'Banglore'
WHERE name = 'Ronak';
```

## ❌ DELETE

Removing specific records:

```sql
DELETE FROM person
WHERE name = 'Ronak';
```

---

# 🧱 Section 3 - Datatypes and Constraints

## 🔠 Datatypes

Datatypes determine what kind of value can be stored in a column:

- **Numeric:** `INT`, `BIGINT`, `DECIMAL`, `NUMERIC`
- **String:** `VARCHAR`, `CHAR`, `TEXT`
- **Boolean:** `BOOLEAN` (True/False)
- **Date/Time:** `DATE`, `TIME`, `TIMESTAMP`
- **Auto-Incrementing:** `SERIAL` (Automatically generates a unique integer)

## 🛡️ Constraints

Constraints are rules enforced on data columns to ensure accuracy, reliability, and validity. If an inserted record violates a constraint, the action is aborted. Common constraints are: `PRIMARY KEY`, `NOT NULL`, `UNIQUE`, `DEFAULT`, `CHECK`.

### 🔑 Primary Key

A combination of `NOT NULL` and `UNIQUE`. Uniquely identifies each row in a table. A table can only have one primary key.

```sql
CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    username VARCHAR(50)
);
```

### 🛑 NOT NULL and Default

- **NOT NULL:** Ensures a column cannot have a `NULL` (empty) value.
- **DEFAULT:** Provides a default value for a column if no explicit value is passed during an insertion.

```sql
CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active'
);
```

---

## 🏆 Task 1: Create an Employee Table

**Problem Statement:** Design and create an employee table using the constraints and datatypes learned above, and insert dummy data.

**Solution:**

```sql
-- 1. Create Table
CREATE TABLE employee (
    emp_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    department VARCHAR(50) DEFAULT 'General',
    salary NUMERIC CHECK (salary > 0),
    hire_date DATE DEFAULT CURRENT_DATE
);

-- 2. Insert Data
INSERT INTO employee (first_name, last_name, department, salary)
VALUES
    ('John', 'Doe', 'IT', 75000),
    ('Jane', 'Smith', 'HR', 60000),
    ('Alice', 'Johnson', 'Finance', 85000);

-- 3. Read Data
SELECT * FROM employee;
```

---

> **💡 Bonus Info: Sequence Functions**
> _(From earlier notes)_
> When using `SERIAL` datatype, behind the scenes, PostgreSQL creates a sequence object. You can manipulate or check it manually:
>
> ```sql
> -- To set the current value of a sequence:
> SELECT setval('person_id_seq', 0);
>
> -- To get the current value of a sequence:
> SELECT currval('person_id_seq');
> ```
