require('dotenv').config()
const express = require('express')
const { findChatBetweenUsers } = require('../controller/chatController')

const router = express.Router()

router.get('/chat/:userId/:otherUserId', findChatBetweenUsers);

module.exports = router
