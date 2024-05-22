require('dotenv').config()
const express = require('express')
const { createPost, getAllPosts, toggleLikePost, getLikedPosts } = require('../controller/postController')

const router = express.Router()

// router.get('/users/:userId/friends', getFriendsOfUser);
router.post('/posts/create', createPost);
router.post('/posts/like-post', toggleLikePost);
router.get('/posts/:userId', getAllPosts);
router.get('/posts/:userId/liked-posts', getLikedPosts);

module.exports = router
