const express = require('express')
const { getUsers, getUserById, createUser, updateUser, deleteUser } = require('../controllers/userController.js')

const userRoutes = express.Router();

userRoutes.get('/', getUsers).post('/', createUser)
userRoutes.get('/:id', getUserById).put('/:id', updateUser).delete('/:id', deleteUser)

module.exports = userRoutes;