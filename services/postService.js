// userService.js
require('dotenv').config()

const { PrismaClient, SourceType, NotificationTypes, FriendStatus } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Service function to register a new user
const createPost = async (userId, postData) => {
    try {
        // Validate the input
        if (!userId || !postData) {
            return { EC: -1, EM: 'Invalid input data' };
        }
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return { EC: -3, EM: "User not found" };
        }

        // Destructure postData to extract content, imageUrl, videoUrl, groupId, and publicStatus
        const { content, imageUrl, videoUrl, groupId, publicStatus } = postData;

        // Create the new post
        const newPost = await prisma.post.create({
            data: {
                authorId: userId,
                content: content || null,
                imageUrl: imageUrl || null,
                videoUrl: videoUrl || null,
                groupId: groupId || null,
                publicStatus: publicStatus || 'PUBLIC', // Default to PUBLIC if not provided
            }
        });

        return { EC: 0, EM: 'Post created successfully', post: newPost };
    } catch (error) {
        // Handle errors
        console.error(error);
        return { EC: -2, EM: 'Internal server error' };
    }
};

const getAllPosts = async (userId) => {
    try {
        // Check if the user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                friendOf: {
                    where: {
                        status: 'ACCEPTED',
                    },
                },
            },
        });

        if (!user) {
            return { EC: -3, EM: "No user was found" };
        }

        // Extract accepted friend IDs from friendOf
        const acceptedFriendOfIds = user.friendOf.map(friendship => friendship.userId);
        // Fetch posts with limit and offset
        const posts = await prisma.post.findMany({
            orderBy: {
                createdAt: 'desc',
            },
            take: 3,
            skip: 0,
            include: {
                author: true, // To get the author details for checking friends
            },
        });

        // Filter posts based on visibility rules
        const filteredPosts = posts.filter(post => {
            if (post.publicStatus === 'PUBLIC') {
                return true;
            }
            if (post.publicStatus === 'FRIENDS') {
                console.log('check acceptedFriendOfIds:', acceptedFriendOfIds, 'post authoid', post.authorId);

                return acceptedFriendOfIds.includes(post.authorId);
            }
            if (post.publicStatus === 'PRIVATE') {
                return post.authorId === userId;
            }
            return false;
        });

        return filteredPosts;
    } catch (error) {
        console.error('Error fetching posts:', error);
        throw error;
    }
};



module.exports = {
    createPost, getAllPosts
};
