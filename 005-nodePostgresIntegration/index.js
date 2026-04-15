const express = require('express')
const app = express();
const createCustomersTable = require('./data/createCustomerData.js')
const userRoutes = require('./routes/userRoutes.js')

app.use(express.json())

createCustomersTable();

app.use('/api/user', userRoutes)

app.listen(5000, () => {
    console.log("Server is running on port 5000");
})