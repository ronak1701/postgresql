const pool = require('../connection.js')
async function createCustomerTable(){
    const query = `CREATE TABLE IF NOT EXISTS customers (
        cust_id SERIAL PRIMARY KEY,
        cust_name VARCHAR(255) NOT NULL,
        cust_age INT,
        cust_email VARCHAR(255) UNIQUE NOT NULL,
        cust_city VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
    )`

    try{
        await pool.query(query);
        console.log("Customers table created successfully");

        const checkDataQuery = await pool.query("select * from customers"); 
        if(checkDataQuery.rows.length === 0){
            const insertQuery = `
                INSERT INTO customers (cust_name, cust_age, cust_email, cust_city) VALUES
                ('John Doe', 30, 'john.doe@example.com', 'New York'),
                ('Jane Smith', 25, 'jane.smith@example.com', 'Los Angeles'),
                ('Alice Johnson', 28, 'alice.johnson@example.com', 'Chicago'),
                ('Bob Brown', 35, 'bob.brown@example.com', 'Houston'),
                ('Charlie Davis', 40, 'charlie.davis@example.com', 'Phoenix')
            `;

            await pool.query(insertQuery);
            console.log("Customers data inserted successfully");
        }         
    }catch(err){
        console.log(err);
    }
}

module.exports = createCustomerTable;