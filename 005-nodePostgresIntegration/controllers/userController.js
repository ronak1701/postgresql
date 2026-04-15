const pool = require('../connection.js')

const getUsers = async (req, res) => {
    try{
        const result = await pool.query("SELECT * FROM customers");
        res.json(result.rows);
    }catch(err){
        console.log(err);
        res.status(500).json({message: "Error fetching users"});
    }
}

const getUserById = async (req, res) => {
    try{
        const result = await pool.query("SELECT * FROM customers WHERE cust_id = $1", [req.params.id]);
        res.json(result.rows);
    }catch(err){
        console.log(err);
        res.status(500).json({message: "Error fetching user"});
    }
}

const createUser = async(req,res) =>{
    try{
        const {name, age, email, city} = req.body;
        const result = await pool.query("INSERT INTO customers (cust_name, cust_age, cust_email, cust_city) VALUES ($1, $2, $3, $4)", [name, age, email, city]);
        res.json({message: "User created successfully"});
    }catch(err){
        console.log(err);
        res.status(500).json({message: "Error creating user"});
    }
}

const updateUser = async(req,res) =>{
    try{
        const {name, age, email, city} = req.body;
        const result = await pool.query("UPDATE customers SET cust_name = $1, cust_age = $2, cust_email = $3, cust_city = $4 WHERE cust_id = $5", [name, age, email, city, req.params.id]);
        res.json(result.rows);
    }catch(err){
        console.log(err);
        res.status(500).json({message: "Error updating user"});
    }
}

const deleteUser = async(req,res) =>{
    try{
        const result = await pool.query("DELETE FROM customers WHERE cust_id = $1", [req.params.id]);
        res.json(result.rows);
    }catch(err){
        console.log(err);
        res.status(500).json({message: "Error deleting user"});
    }
}

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser }