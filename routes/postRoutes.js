require('dotenv').config()
const express = require('express')
const { createPost, getAllPosts } = require('../controller/postController')

const router = express.Router()

// router.get('/users/:userId/friends', getFriendsOfUser);
router.post('/posts/create', createPost);
router.get('/posts/:userId', getAllPosts);

module.exports = router
