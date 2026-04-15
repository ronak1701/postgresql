# 005 - Node.js and PostgreSQL Integration

## Description
This practical demonstrates the integration of a Node.js Express application with a PostgreSQL database. It covers the essential aspects of building a RESTful API that interacts with a relational database.

### Key Features:
- **Database Connection**: Establishes a connection to PostgreSQL using the `pg` (node-postgres) library with connection pooling (`pg.Pool`).
- **RESTful API**: Implementation of a complete GET, POST, PUT, and DELETE interface for managing customer data.
- **Auto-Initialization**: Automatically creates the `customers` table and seeds it with initial data if it doesn't exist or is empty upon server startup.
- **Security**: Uses environment variables via `dotenv` for sensitive database credentials and parameterized queries to prevent SQL injection.

---

## Project Structure
```text
005-nodePostgresIntegration/
├── controllers/
│   └── userController.js    # Logic for handling CRUD operations
├── data/
│   └── createCustomerData.js # Table creation and data seeding script
├── routes/
│   └── userRoutes.js        # Express route definitions
├── .env                     # Database configuration (Username, Password, etc.)
├── connection.js            # PostgreSQL Pool configuration
├── index.js                 # Entry point of the Express application
└── package.json             # Project dependencies and scripts
```

---

## Prerequisites
- **Node.js**: Ensure Node.js is installed on your system.
- **PostgreSQL**: A running PostgreSQL instance with a database created.

---

## Setup & Installation

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root directory with the following variables:
   ```env
   DB_USER=your_postgresql_user
   DB_HOST=localhost
   DB_NAME=your_database_name
   DB_PASSWORD=your_password
   DB_PORT=5432
   ```

3. **Start the Application**:
   ```bash
   npm start
   ```
   The server will start on `http://localhost:5000`.

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/user` | Fetch all customers from the database. |
| **GET** | `/api/user/:id` | Fetch a specific customer by their ID. |
| **POST** | `/api/user` | Create a new customer record. |
| **PUT** | `/api/user/:id` | Update an existing customer's details. |
| **DELETE** | `/api/user/:id` | Remove a customer from the database. |

---

## Technical Details

### Connection Pooling
The application uses `pg.Pool` in `connection.js`. This is more efficient than creating a single client for every request as it allows reusing a cache of open connections.

### Data Seeding
The script in `data/createCustomerData.js` ensures that the `customers` table is created with the following schema:
- `cust_id`: Serial Primary Key
- `cust_name`: String (Not Null)
- `cust_age`: Integer
- `cust_email`: String (Unique, Not Null)
- `cust_city`: String
- `created_at`: Timestamp (Defaults to current time)

### Error Handling
Each controller function is wrapped in a `try-catch` block to ensure that database errors are logged and appropriate HTTP status codes (like `500 Internal Server Error`) are returned to the client.
