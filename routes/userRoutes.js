require('dotenv').config()
const express = require('express')
const { getFriendsOfUser, getUsersNotInFriendsList,
    getInfoById, toggleAddFriendRequest,
    getFriendRequests, editUserAvatar, getAvatar,
    acceptFriendRequest } = require('../controller/userController')

const router = express.Router()

router.get('/users/:userId/friends', getFriendsOfUser);
router.get('/users/:userId/avatar', getAvatar);
router.get('/users/:userId/non-friends', getUsersNotInFriendsList);
router.get('/users/:userId/friend-requests', getFriendRequests);
router.get('/users/:userId', getInfoById);
router.post('/users/:userId/friends/:friendId', toggleAddFriendRequest);
router.post('/users/edit-avatar', editUserAvatar);
router.post('/users/accept-friend-request', acceptFriendRequest);

module.exports = router
