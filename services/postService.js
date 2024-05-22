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
                likes: true
            },
        });

        // Filter posts based on visibility rules
        const filteredPosts = posts.filter(post => {
            if (post.publicStatus === 'PUBLIC') {
                return true;
            }
            if (post.publicStatus === 'FRIENDS') {

                return acceptedFriendOfIds.includes(post.authorId) || post.authorId === userId;
            }
            if (post.publicStatus === 'PRIVATE') {
                return post.authorId === userId;
            }
            return false;
        });

        return { EC: 0, EM: 'Get all fitlered posts successfully', data: filteredPosts };
    } catch (error) {
        console.error('Error fetching posts:', error);
        throw error;
    }
};


const toggleLikePost = async (userId, postId) => {
    try {
        console.log('uid;', userId, 'pid:', postId);
        // Find the user who is liking/unliking the post
        const fromUser = await prisma.user.findUnique({ where: { id: userId } });

        if (!fromUser) {
            return { EC: -1, EM: 'User not found' };
        }

        await prisma.$transaction(async (tx) => {
            // Check if the like already exists
            const existingLike = await tx.like.findFirst({
                where: {
                    userId,
                    postId,
                },
                include: {
                    post: true, // Include the post details to get the authorId
                },
            });

            if (existingLike) {
                // If the like exists, remove it (unlike the post)
                await tx.like.delete({
                    where: {
                        id: existingLike.id,
                    },
                });

                // Delete the corresponding notification
                await tx.notification.deleteMany({
                    where: {
                        type: NotificationTypes.POST_LIKE,
                        userId: existingLike.post.authorId,
                        fromId: userId,
                        fromType: SourceType.USER,
                    },
                });
            } else {
                // If the like does not exist, add it (like the post)
                const newLike = await tx.like.create({
                    data: {
                        userId,
                        postId,
                    },
                    include: {
                        post: true, // Include the post details to get the authorId
                    },
                });

                // Only create a notification if the liker is not the author of the post
                if (userId !== newLike.post.authorId) {
                    await tx.notification.create({
                        data: {
                            message: `${fromUser.name} liked your post.`,
                            type: NotificationTypes.POST_LIKE,
                            userId: newLike.post.authorId, // The author of the post
                            fromId: fromUser.id,
                            fromType: SourceType.USER,
                        },
                    });
                }
            }
            return { EC: 0, EM: 'Post liked successfully' };
        });

        return { EC: 0, EM: 'Post like toggled successfully' };
    } catch (error) {
        // Handle errors
        console.error(error);
        return { EC: -2, EM: 'Internal server error' };
    }
};

const getLikedPosts = async (userId) => {
    try {

        const fromUser = await prisma.user.findUnique({ where: { id: userId } });

        if (!fromUser) {
            return { EC: -1, EM: 'User not found' };
        }
        const likedPosts = await prisma.like.findMany({
            where: {
                userId: userId
            },
            include: {
                post: true
            }
        })
        return {
            EC: 0,
            EM: 'Get liked posts successfully',
            data: likedPosts
        }
    } catch (error) {
        // Handle errors
        console.error(error);
        return { EC: -2, EM: 'Internal server error' };
    }
}


module.exports = {
    createPost, getAllPosts, toggleLikePost,
    getLikedPosts
};
