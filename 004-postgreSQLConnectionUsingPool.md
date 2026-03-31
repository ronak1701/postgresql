# PostgreSQL Connection Pooling in Node.js

When building a Node.js application that interacts with a PostgreSQL database, managing database connections efficiently is crucial for performance and scalability. The `pg` (node-postgres) package provides a `Pool` class specifically designed for this purpose.

## Why Use a Connection Pool?

Creating a new database connection is an expensive operation. If your application creates a new connection for every single query or every incoming HTTP request, it will quickly become slow and might even exhaust the database's connection limits.

A **Connection Pool** solves this by:
1. **Reusing Connections:** It maintains a "pool" of open connections. When a query needs to be executed, it checks out an existing connection, runs the query, and then returns the connection to the pool to be used again.
2. **Managing Concurrency:** It limits the maximum number of simultaneous connections to the database, preventing it from being overwhelmed.
3. **Handling Queues:** If all connections in the pool are busy, new requests are queued until a connection becomes available.

## Prerequisites

First, ensure you have the `pg` package installed in your Node.js project:

```bash
npm install pg
```

## Implementation Example

Below is a complete, modular example of how to implement and use a PostgreSQL connection pool.

### 1. Creating the Database Configuration (`db.js`)

It is a best practice to keep your database connection logic in a separate module.

```javascript
// db.js
const { Pool } = require('pg');

// Create a new Pool instance
// Ideally, these sensitive details should come from environment variables (e.g., process.env.DB_USER)
const pool = new Pool({
  user: 'your_db_username',
  host: 'localhost',
  database: 'your_db_name',
  password: 'your_db_password',
  port: 5432,         // Default PostgreSQL port
  max: 20,            // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Attach an error handler to the pool to catch unexpected errors on idle clients
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  // Expose a method to execute queries directly on the pool
  // This is the recommended way for simple queries where you don't need a specific client
  query: (text, params) => pool.query(text, params),
  
  // Expose the pool if you need to manually check out a client (e.g., for transactions)
  pool: pool 
};
```

### 2. Using the Pool (`index.js`)

Here is how you can use the configured `pool` in your application to execute queries.

```javascript
// index.js
const db = require('./db');

async function getUsers() {
  try {
    // We use the query method exposed from our db.js file.
    // The pool automatically checks out a client, runs the query, and returns the client to the pool.
    const res = await db.query('SELECT * FROM users ORDER BY id ASC LIMIT 5');
    console.log('Users found:', res.rows);
  } catch (err) {
    console.error('Error executing query', err.stack);
  }
}

async function insertUser(name, email) {
  try {
    // Parameterized queries are crucial to prevent SQL injection attacks
    const queryText = 'INSERT INTO users(name, email) VALUES($1, $2) RETURNING *';
    const values = [name, email];
    
    const res = await db.query(queryText, values);
    console.log('Inserted user:', res.rows[0]);
  } catch (err) {
    console.error('Error inserting user', err.stack);
  }
}

// Example Execution
(async () => {
  console.log('--- Fetching Users ---');
  await getUsers();

  console.log('\n--- Inserting a User ---');
  await insertUser('John Doe', 'john.doe@example.com');
  
  // Gracefully shutting down the pool when the application is about to exit
  // This ensures all active queries are completed and connections are closed properly
  await db.pool.end();
  console.log('\nPool has ended.');
})();
```

## Advanced: Using a Specific Client for Transactions

For operations that must happen over the same physical connection sequentially, such as **Transactions**, you must manually check out a client from the pool.

```javascript
async function executeTransaction() {
  // 1. Checkout a client from the pool
  const client = await db.pool.connect();

  try {
    // 2. Start the transaction
    await client.query('BEGIN');
    
    // 3. Execute multiple queries using the SAME client
    const insertUserText = 'INSERT INTO users(name) VALUES($1) RETURNING id';
    const res = await client.query(insertUserText, ['Alice']);
    
    const insertProfileText = 'INSERT INTO profiles(user_id, bio) VALUES ($1, $2)';
    const profileValues = [res.rows[0].id, 'Hello from Alice!'];
    await client.query(insertProfileText, profileValues);
    
    // 4. Commit the transaction if everything succeeded
    await client.query('COMMIT');
    console.log('Transaction completed successfully.');

  } catch (e) {
    // 5. Rollback the transaction if any query failed
    await client.query('ROLLBACK');
    console.error('Transaction failed, rolled back.', e.stack);
  } finally {
    // 6. ALWAYS release the client back to the pool in a finally block
    client.release();
  }
}
```

## Summary

- Use `pool.query(text, params)` for standard, independent queries.
- Connect manually via `pool.connect()` only when you require an isolated, continuous connection session (e.g., executing transactions).
- **Always** release clients back to the pool via `client.release()` when checking them out manually.
- Handle idle pool errors to prevent unhandled promise rejections from crashing your app.
