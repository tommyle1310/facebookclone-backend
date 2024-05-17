require('dotenv').config()
const express = require('express')
const { getFriendsOfUser, getUsersNotInFriendsList } = require('../controller/userController')

const router = express.Router()

router.get('/users/:userId/friends', getFriendsOfUser);
router.get('/users/:userId/non-friends', getUsersNotInFriendsList);

module.exports = router
