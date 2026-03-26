# PostgreSQL - Part 2

This document covers intermediate to advanced PostgreSQL concepts, including data refining, operators, aggregate and string functions, relationships, joins, and more.

## Data Refining

Filtering and sorting data using `WHERE`, `ORDER BY`, `DISTINCT`, `LIMIT`, and `LIKE`.

### WHERE Clause

Used to filter records that fulfill a specified condition.

```sql
SELECT * FROM employees WHERE department = 'Sales';
```

### ORDER BY Clause

Sorts the result set in ascending (`ASC`) or descending (`DESC`) order.

```sql
SELECT * FROM employees ORDER BY salary DESC;
SELECT * FROM employees ORDER BY department ASC, salary DESC;
```

### DISTINCT Clause

Removes duplicate values from the result set.

```sql
SELECT DISTINCT department FROM employees;
```

### LIMIT and OFFSET

Limits the number of records returned. `OFFSET` skips a specified number of rows.

```sql
-- Get top 5 highest paid employees
SELECT * FROM employees ORDER BY salary DESC LIMIT 5;

-- Get the next 5 (Pagination)
SELECT * FROM employees ORDER BY salary DESC LIMIT 5 OFFSET 5;
```

### LIKE Operator

Used in a `WHERE` clause to search for a specified pattern in a column using wildcards `%` (zero, one, or multiple characters) and `_` (single character).

```sql
-- Find employees whose name starts with 'A'
SELECT * FROM employees WHERE first_name LIKE 'A%';

-- Find employees whose name ends with 'son'
SELECT * FROM employees WHERE last_name LIKE '%son';

-- Find employees whose name has 'a' as the second character
SELECT * FROM employees WHERE first_name LIKE '_a%';
```

---

## Operators

PostgreSQL supports various operators including Relational (Comparison) and Logical operators to form complex queries.

### Relational Operators

- `=`: Equal to
- `<>` or `!=`: Not equal to
- `>`: Greater than
- `<`: Less than
- `>=`: Greater than or equal to
- `<=`: Less than or equal to

```sql
SELECT * FROM products WHERE price >= 100 AND price <= 500;
SELECT * FROM products WHERE category != 'Electronics';
```

### Logical Operators

- `AND`: True if all conditions separated by AND are True.
- `OR`: True if any of the conditions separated by OR is True.
- `NOT`: Displays a record if the condition(s) is NOT True.
- `IN`: Allows specifying multiple values in a `WHERE` clause.
- `BETWEEN`: Selects values within a given range.

```sql
-- Using AND & OR
SELECT * FROM employees WHERE department = 'IT' OR department = 'HR';

-- Using IN
SELECT * FROM employees WHERE department IN ('IT', 'HR', 'Finance');

-- Using BETWEEN
SELECT * FROM products WHERE price BETWEEN 100 AND 500;

-- Using IS NULL
SELECT * FROM orders WHERE ship_date IS NULL;
```

---

## Aggregate Functions

Functions that perform a calculation on a set of values and return a single value.

- **COUNT()**: Returns the number of rows.
- **MIN()**: Returns the smallest value.
- **MAX()**: Returns the largest value.
- **SUM()**: Returns the sum of a numeric column.
- **AVG()**: Returns the average value of a numeric column.

```sql
SELECT
    COUNT(employee_id) AS total_employees,
    MIN(salary) AS min_salary,
    MAX(salary) AS max_salary,
    SUM(salary) AS total_salary_cost,
    ROUND(AVG(salary), 2) AS average_salary
FROM employees;
```

---

## GROUP BY

Groups rows that have the same values into summary rows, often used with aggregate functions to perform more complex analysis.

```sql
-- Find the number of employees in each department
SELECT department, COUNT(*) AS num_employees
FROM employees
GROUP BY department;

-- Find total sales per region
SELECT region, SUM(sales_amount) AS total_sales
FROM sales
GROUP BY region;
```

---

## HAVING Clause

The `HAVING` clause is used to filter data based on aggregate functions. Because the `WHERE` keyword cannot be used with aggregate functions, `HAVING` filters the data **after** the `GROUP BY` clause is applied.

```sql
-- Filtering aggregated data: Find departments with more than 10 employees
SELECT department, COUNT(*) AS num_employees
FROM employees
GROUP BY department
HAVING COUNT(*) > 10;

-- Find regions with total sales greater than 50000
SELECT region, SUM(sales_amount) AS total_sales
FROM sales
GROUP BY region
HAVING SUM(sales_amount) > 50000;
```

---

## ROLLUP and COALESCE

The `ROLLUP` clause is an extension to the `GROUP BY` clause. It allows you to generate multiple grouping sets and calculate partial or grand totals in a single query.

```sql
-- Calculate sales per region, but also include a row for the grand total
SELECT COALESCE(region, 'Grand Total'), SUM(sales_amount) AS total_sales
FROM sales
GROUP BY ROLLUP (region) ORDER BY total_sales;

-- ROLLUP with multiple columns: calculates totals at each hierarchy level
SELECT region, category, SUM(sales_amount) AS total_sales
FROM sales
GROUP BY ROLLUP (region, category);
-- This groups by (region, category), then by (region), and finally the grand total ().
```

---

## String Functions

Functions to manipulate and format text data.

### CONCAT

Adds two or more expressions together. Alternative syntax is the `||` operator.

```sql
SELECT CONCAT(first_name, ' ', last_name) AS full_name FROM employees;

-- Alternative using concatenation operator ||
SELECT first_name || ' ' || last_name AS full_name FROM employees;
```

### REPLACE

Replaces all occurrences of a substring within a string with a new substring.

```sql
-- Syntax: REPLACE(string, old_substring, new_substring)
-- Example: Replacing 'Assistant' with 'Asst.' in job titles
SELECT REPLACE(job_title, 'Assistant', 'Asst.') FROM employees;
```

### SUBSTR (Substring)

Extracts a substring from a string.

```sql
-- Syntax: SUBSTR(string, start_position, length)
-- Extract first 3 characters of a phone number (e.g., area code)
SELECT SUBSTR(phone_number, 1, 3) AS area_code FROM customers;
```

### UPPER, LOWER, LENGTH

Additional useful string manipulations.

```sql
SELECT
    UPPER(first_name) as upper_name,
    LOWER(last_name) as lower_name,
    LENGTH(first_name) as name_len
FROM employees;
```

---

## Exercises

_Practical Application of learned concepts._

**Question 1:** Find the names of the top 3 highest-earning employees in the 'Engineering' department.

```sql
SELECT first_name, last_name, salary
FROM employees
WHERE department = 'Engineering'
ORDER BY salary DESC
LIMIT 3;
```

**Question 2:** Find the total revenue generated grouped by the year.

```sql
SELECT
    EXTRACT(YEAR FROM order_date) AS order_year,
    SUM(total_amount) AS total_revenue
FROM orders
GROUP BY order_year
ORDER BY order_year DESC;
```

---

## ALTER Query

Modifies the structure of an existing table (adding, modifying, or deleting columns and constraints).

```sql
-- Add a new column
ALTER TABLE employees ADD COLUMN date_of_birth DATE;

-- Rename a column
ALTER TABLE employees RENAME COLUMN date_of_birth TO dob;

-- Modify a column type
ALTER TABLE employees ALTER COLUMN dob TYPE TIMESTAMP;

-- Drop a column
ALTER TABLE employees DROP COLUMN dob;

-- Rename a table
ALTER TABLE employees RENAME TO staff;
```

---

## CHECK Constraint

Ensures that all values in a column satisfy specific conditions, maintaining data integrity.

```sql
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) CHECK (price > 0), -- Price must be positive
    discount DECIMAL(10, 2) CHECK (discount >= 0 AND discount < price)
);

-- Adding CHECK constraint to an existing table
ALTER TABLE employees
ADD CONSTRAINT check_salary CHECK (salary >= 30000);
```

---

## CASE Expression

The SQL `CASE` expression goes through conditions and returns a value when the first condition is met (like an if-then-else statement).

```sql
-- Using CASE to create a new derived column in a SELECT statement
SELECT
    product_name,
    price,
    CASE
        WHEN price < 20 THEN 'Budget'
        WHEN price BETWEEN 20 AND 100 THEN 'Standard'
        ELSE 'Premium'
    END AS price_category
FROM products;

-- Using CASE to perform conditional updates
UPDATE employees
SET salary = CASE
    WHEN department = 'HR' THEN salary * 1.05
    WHEN department = 'Engineering' THEN salary * 1.10
    ELSE salary * 1.03
END;
```

---

## Relationships

In a relational database, data is distributed across multiple tables to reduce redundancy. Relationships define how these tables are logically connected.

Types of relationships:

1. **One-to-One (1:1)**: A record in Table A relates to exactly one record in Table B.
2. **One-to-Many (1:N)**: A record in Table A relates to multiple records in Table B. (The most common type)
3. **Many-to-Many (M:N)**: Multiple records in Table A relate to multiple records in Table B.

---

## Foreign Key

A column (or group of columns) in one table that uniquely identifies a row of another table. It establishes a link between data in two tables to represent relationships.

```sql
CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(50) NOT NULL
);

CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    department_id INTEGER,
    -- Establishing the Foreign Key referencing the departments table (One-to-Many)
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);
```

---

## One-to-One Relationship

A one-to-one relationship occurs when one record in a table is associated with only one record in another table. It's often used to split a wide table into smaller ones or to secure sensitive data.

**Example**: A User and their User Profile (which holds sensitive data like SSN).

```sql
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE user_profiles (
    profile_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL, -- The UNIQUE constraint ensures a 1-to-1 connection
    ssn VARCHAR(11),
    date_of_birth DATE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

_Note: Making the Foreign Key `UNIQUE` is the key to creating a 1:1 relationship rather than a 1:N relationship._

---

## JOINS

A `JOIN` clause is used to combine rows from two or more tables, based on a related column between them.

1. **INNER JOIN**: Returns records that have matching values in both tables.
2. **LEFT (OUTER) JOIN**: Returns all records from the left table, and matched records from the right table.
3. **RIGHT (OUTER) JOIN**: Returns all records from the right table, and matched records from the left table.
4. **FULL (OUTER) JOIN**: Returns all records when there is a match in either the left or right table.

```sql
-- Inner Join Example (Only employees who are assigned to a department)
SELECT e.name, d.department_name
FROM employees e
INNER JOIN departments d ON e.department_id = d.department_id;

-- Left Join Example (Shows all employees, even if they don't have an assigned department)
SELECT e.name, d.department_name
FROM employees e
LEFT JOIN departments d ON e.department_id = d.department_id;
```

---

## Many-to-Many Relationship

A many-to-many relationship occurs when multiple records in one table relate to multiple records in another. This requires a **junction table** (or associative table) to map the relationships.

**Example**: Students and Courses. A student can enroll in many courses, and a course can have many students.

```sql
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    title VARCHAR(100)
);

-- Junction Table connecting Students and Courses
CREATE TABLE enrollments (
    student_id INTEGER REFERENCES students(student_id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(course_id) ON DELETE CASCADE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    PRIMARY KEY (student_id, course_id) -- Composite Primary Key prevents duplicate enrollments
);
```

To view the Many-to-Many data, you typically join all three tables:

```sql
SELECT s.name as student_name, c.title as course_title
FROM students s
JOIN enrollments e ON s.student_id = e.student_id
JOIN courses c ON e.course_id = c.course_id;
```

---

## Project: E-STORE

A hands-on project creating a store database to demonstrate table creation, relationships, and constraints in practice.

```sql
-- 1. Users Table
CREATE TABLE store_users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Products Table
CREATE TABLE store_products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) CHECK (price > 0),
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0)
);

-- 3. Orders Table (One-to-Many: 1 User has Many Orders)
CREATE TABLE store_orders (
    order_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES store_users(user_id) ON DELETE CASCADE,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Pending'
);

-- 4. Order_Items Table (Many-to-Many Junction between Orders and Products)
CREATE TABLE store_order_items (
    order_id INTEGER REFERENCES store_orders(order_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES store_products(product_id) ON DELETE CASCADE,
    quantity INTEGER CHECK (quantity > 0),
    price_at_purchase DECIMAL(10,2) CHECK (price_at_purchase > 0),
    PRIMARY KEY (order_id, product_id)
);
```

---

## VIEWS

A View is a virtual table based on the result-set of an SQL statement. It simplifies complex queries and can restrict data access for security purposes.

```sql
-- Creating a View
CREATE VIEW active_customers AS
SELECT user_id, username
FROM store_users
WHERE user_id IN (SELECT DISTINCT user_id FROM store_orders);

-- Requesting data from a View (queries just like a normal table)
SELECT * FROM active_customers;

-- Replacing/Updating an existing View
CREATE OR REPLACE VIEW active_customers AS
SELECT u.user_id, u.username, COUNT(o.order_id) as total_orders
FROM store_users u
JOIN store_orders o ON u.user_id = o.user_id
GROUP BY u.user_id, u.username;

-- Dropping a View
DROP VIEW active_customers;
```
