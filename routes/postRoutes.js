require('dotenv').config()
const express = require('express')
const { createPost, getAllPosts, toggleLikePost, getLikedPosts, addCommentToPost, getPostComments, getUserPosts } = require('../controller/postController')

const router = express.Router()

// router.get('/users/:userId/friends', getFriendsOfUser);
router.post('/posts/create', createPost);
router.post('/posts/like-post', toggleLikePost);
router.post('/posts/comment-post', addCommentToPost);
router.get('/posts/:userId', getAllPosts);
router.get('/posts/:userId/liked-posts', getLikedPosts);
router.get('/posts/:postId/comments', getPostComments);
router.get('/posts/from/:userId/:viewerId', getUserPosts);

module.exports = router
