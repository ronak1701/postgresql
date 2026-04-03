# Pagination Techniques in SQL (PostgreSQL)

Pagination is the process of dividing a large dataset into smaller, manageable chunks (pages). When a query returns thousands or millions of rows, fetching them all at once can overwhelm the database, network, and the client application. Pagination allows you to fetch data iteratively.

PostgreSQL mainly supports two common pagination techniques:
1. **Offset-Based Pagination** (using `LIMIT` and `OFFSET`)
2. **Keyset / Cursor-Based Pagination** (using a unique identifier or "cursor")

---

## 1. Offset-Based Pagination

Offset-based pagination is the most common and easiest method to implement. It uses two clauses:
- `LIMIT`: Specifies the maximum number of rows to return.
- `OFFSET`: Specifies the number of rows to skip before returning the results.

### Syntax
```sql
SELECT * FROM table_name
ORDER BY column_name
LIMIT {page_size} OFFSET {skip_count};
```

### Example
Suppose we have an `employees` table and we want to display 10 employees per page, ordered by their `id`.

**Page 1:** (Skip 0, Get 10)
```sql
SELECT id, name, salary FROM employees
ORDER BY id
LIMIT 10 OFFSET 0;
```

**Page 2:** (Skip 10, Get 10)
```sql
SELECT id, name, salary FROM employees
ORDER BY id
LIMIT 10 OFFSET 10;
```

**Page 3:** (Skip 20, Get 10)
```sql
SELECT id, name, salary FROM employees
ORDER BY id
LIMIT 10 OFFSET 20;
```

### Formula for Offset Calculation
Usually, the client requests a specific `page_number` and `page_size`. You can calculate the offset as follows:
```text
OFFSET = (page_number - 1) * page_size
```

### Pros:
- **Easy to implement:** Very straightforward syntax.
- **Random access:** Users can jump directly to any page (e.g., jump to page 50).
- **Stateless:** The server doesn't need to remember where the user left off.

### Cons & Performance Issues:
- **Performance degrades with large offsets:** The database still has to scan, read, and sort the rows that are skipped by the `OFFSET`. If you request `LIMIT 10 OFFSET 1000000`, PostgreSQL sorts and counts 1,000,010 rows just to return 10. This makes deep pagination extremely slow.
- **Data anomalies (Inconsistent Results):** If items are inserted or deleted while the user is paginating, they might see duplicate items or miss items.

---

## 2. Keyset / Cursor-Based Pagination

Cursor-based pagination (or Keyset pagination) solves the performance issue of offset pagination. Instead of skipping rows using an `OFFSET`, it uses the last fetched record's unique identifier (or a sort column) to fetch the *next* set of records.

### Concept
You remember the last value of the sorted column(s) from the previous page, and you use a `WHERE` clause to fetch rows that come *after* that value.

### Syntax
```sql
SELECT * FROM table_name
WHERE sort_column > {last_seen_value}
ORDER BY sort_column
LIMIT {page_size};
```

### Example
Assuming we want 10 employees per page, ordered by `id`.

**Page 1:** (No condition, just get the first 10)
```sql
SELECT id, name, salary FROM employees
ORDER BY id ASC
LIMIT 10;
```
*(Suppose the last employee returned on this page has `id = 45`)*

**Page 2:** (Fetch the next 10 where `id` is greater than 45)
```sql
SELECT id, name, salary FROM employees
WHERE id > 45
ORDER BY id ASC
LIMIT 10;
```
*(Suppose the last employee returned on this page has `id = 92`)*

**Page 3:** (Fetch the next 10 where `id` is greater than 92)
```sql
SELECT id, name, salary FROM employees
WHERE id > 92
ORDER BY id ASC
LIMIT 10;
```

### Handling Multi-Column Sorting
If you sort by a non-unique column (like `salary`), you must also include a unique column (like `id`) as a tie-breaker.

**Initial Query:**
```sql
SELECT id, name, salary FROM employees
ORDER BY salary DESC, id ASC
LIMIT 10;
```

*(Suppose the last record has `salary = 50000` and `id = 120`)*

**Next Page Query:**
```sql
SELECT id, name, salary FROM employees
WHERE (salary, id) < (50000, 120) -- Tuple comparison
ORDER BY salary DESC, id ASC
LIMIT 10;
```

### Pros:
- **Extremely Fast:** It leverages indexes directly. A B-Tree index can instantly jump to the `last_seen_value` without scanning previous rows. Performance is consistent regardless of how deep you paginate.
- **Consistent Data:** Not affected by new inserts or deletes happening on previous pages. You won't see duplicates or miss rows.

### Cons:
- **No random access:** You cannot say "jump directly to page 50". You can only go to the "next" or "previous" page.
- **Slightly more complex to implement:** The client needs to keep track of the cursor (last seen value).
- **Requires sort column indexing:** To be fast, the columns used in the `ORDER BY` and `WHERE` clauses must be indexed.

---

## Summary: Which one to choose?

| Feature | Offset-Based (`LIMIT`/`OFFSET`) | Cursor-Based (Keyset) |
| :--- | :--- | :--- |
| **Best Used For** | Small data sets, admin panels, direct page navigation (1, 2, 3... 50). | Infinite scrolling, large data sets, APIs, mobile apps. |
| **Performance** | Slows down significantly on deep pages (large offsets). | Fast and consistent regardless of depth. |
| **Data Consistency**| Susceptible to missing or duplicating records if data changes. | Immune to data changes on previous pages. |
| **Random Access** | Yes (Can jump to page `N`). | No (Only Next/Previous). |
| **Implementation** | Very easy. | Moderate (requires careful handling of cursors and indexes). |

In most modern applications (like social media feeds, infinite scrolling, or high-performance APIs), **Cursor-Based Pagination** is the recommended approach.
