require('dotenv').config()
const jwt = require('jsonwebtoken')
const express = require('express')
const bcrypt = require('bcrypt')
const { PrismaClient } = require('@prisma/client')
const { registerUser, loginUser } = require('../controller/userController')

const prisma = new PrismaClient()
const router = express.Router()

router.post('/signup', registerUser);



router.post('/signin', loginUser)

module.exports = router
