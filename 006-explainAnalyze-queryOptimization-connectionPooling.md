# PostgreSQL Optimization & Connection Pooling

## 1. EXPLAIN ANALYZE

The `EXPLAIN` command in PostgreSQL shows the execution plan that the database planner generates for a given statement. It displays how tables will be scanned—such as via a sequential scan or index scan—and which join algorithms will be used.

Using `EXPLAIN ANALYZE` goes a step further by actually executing the query, providing both the estimated costs and the real execution times.

### Syntax
```sql
EXPLAIN ANALYZE SELECT * FROM table_name WHERE condition;
```

### Key Metrics from EXPLAIN ANALYZE:
- **Execution Time**: The total time taken to execute the query.
- **Planning Time**: The time taken to generate the execution plan.
- **Cost**: The estimated cost of running the query. Represented as `startup_cost..total_cost`. The first number is the startup cost before the first row can be returned, and the second is the total cost to return all rows.
- **Rows**: The estimated (and actual) number of rows output by the plan node.
- **Loops**: The number of times the node was executed.

### Example
```sql
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
```

---

## 2. Query Optimization

Query optimization involves structuring database schema and queries to minimize resource consumption (CPU, Memory, I/O) and execution time.

### Best Practices for Query Optimization:
1. **Use Indexes Strategically**: Ensure columns used frequently in `WHERE`, `JOIN`, `ORDER BY`, and `GROUP BY` clauses are indexed. Be careful not to over-index, as this slows down write operations (`INSERT`, `UPDATE`, `DELETE`).
2. **Select Only Necessary Columns**: Avoid `SELECT *`. Retrieve only the columns you actually need to reduce data transfer and memory overhead.
3. **Use LIMIT and OFFSET**: For large datasets, use pagination with `LIMIT` and `OFFSET` to prevent retrieving massive numbers of rows at once.
4. **Avoid Functions on Indexed Columns**: Using functions on indexed columns in a `WHERE` clause (e.g., `LOWER(email) = 'test@example.com'`) will bypass a standard index. Consider using functional indexes instead.
5. **Optimize JOINs**: Prefer `INNER JOIN` over `OUTER JOIN` if possible, and avoid Cartesian products by ensuring every join has a valid condition.
6. **Analyze Query Plans**: Routinely use `EXPLAIN ANALYZE` to identify bottlenecks such as sequential table scans that could benefit from an index.

---

## 3. Connection Pooling

Connecting to a database is an expensive operation. If an application opens and closes a new connection for every single query or HTTP request, it will severely degrade performance. 

Connection Pooling maintains a pool of active database connections in memory. When a query needs to be executed, it "borrows" a connection from the pool, runs the query, and then "returns" the connection to the pool to be reused.

### Benefits:
- **Performance**: Eliminates the overhead of repeatedly establishing and tearing down connections.
- **Scalability**: Handles thousands of concurrent user requests using a small, controlled number of physical database connections.
- **Resource Management**: Prevents the database server from crashing due to running out of connection limits or memory.

### Example: Connection Pooling in Node.js (with `pg` module)

When using the Node.js `pg` module, the `Pool` class handles the heavy lifting of connection management.

Below is an example showing how you can monitor the state of the connection pool (total, idle, and waiting connections) while firing multiple concurrent queries.

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'your_db',
  password: 'your_password',
  port: 5432,
  max: 20, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
});

async function testPool() {
  const promises = [];
  
  // Firing 100 concurrent queries
  for (let i = 0; i < 100; i++) {
    console.log("Total:", pool.totalCount);
    console.log("Idle:", pool.idleCount);
    console.log("Waiting:", pool.waitingCount);
    promises.push(pool.query("SELECT pg_backend_pid()"));
  }
  
  // Wait for all queries to finish and print the backend process IDs
  await Promise.all(promises).then((res) =>
    console.log(res.map((r) => r.rows[0].pg_backend_pid)),
  );
}

testPool().catch(console.error);
```

In this example, even if we launch 100 concurrent queries, the pool guarantees it will never open more than 20 simultaneous connections. The surplus queries will queue up (`waitingCount`) until a connection is freed and returned to the pool (`idleCount`).
