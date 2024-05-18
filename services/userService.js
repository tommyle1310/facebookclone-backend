// userService.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Service function to register a new user
const registerUser = async (email, password, name) => {
    try {
        // Check if required fields are provided
        if (!email || !password || !name) {
            return { EC: 1, EM: "You must provide email, password, and name" };
        }

        // Check if the user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return { EC: -1, EM: "Email already exists" };
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
            },
        });

        // Generate JWT token
        const token = jwt.sign({ userId: newUser.id }, process.env.JWT_KEY);

        // Return success response with token
        return { EC: 0, token };
    } catch (error) {
        // Handle errors
        console.error(error);
        return { EC: -2, EM: 'Internal server error' };
    }
};

const loginUser = async (email, password) => {
    try {
        // Check if email and password are provided
        if (!email || !password) {
            return { EC: 1, EM: "You must provide email and password" };
        }

        // Find the user by email
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return { EC: 2, EM: "Invalid email or password" };
        }

        // Compare the provided password with the stored password
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return { EC: 2, EM: "Invalid email or password" };
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_KEY);

        // Return success response with token
        return { EC: 0, token, email: user.email, name: user.name, image: user.image, id: user.id };
    } catch (error) {
        // Handle errors
        console.error(error);
        return { EC: -2, EM: 'Internal server error' };
    }
};

const getInfoById = async (userId) => {
    try {
        // Fetch the user by ID including required information
        const userInfo = await prisma.user.findUnique({
            where: {
                id: userId,
            },
            include: {
                // Include any additional fields you want to fetch
                posts: true, // Example: Fetch user's posts
                comments: true, // Example: Fetch user's comments
                likes: true, // Example: Fetch user's likes
                eventsCreated: true, // Example: Fetch events created by the user
                eventsAttending: true, // Example: Fetch events the user is attending
                notifications: true, // Example: Fetch user's notifications
                messagesSent: true, // Example: Fetch messages sent by the user
                messagesReceived: true, // Example: Fetch messages received by the user
                friends: {
                    include: {
                        friend: true,
                    },
                },
                friendOf: {
                    include: {
                        user: true,
                    },
                },
                // Add more fields as needed
            },
        });

        // Check if the user exists
        if (!userInfo) {
            throw new Error('User not found');
        }

        // Extract common friends
        const commonFriends = userInfo.friends.map((friendship) => friendship.friend);

        // Return the user information and common friends
        // userInfo.officialFriends = commonFriends
        return userInfo
    } catch (error) {
        console.error('Error fetching user information:', error);
        throw error;
    }
};

const getFriendsOfUser = async (userId) => {
    try {
        const userWithFriends = await prisma.user.findUnique({
            where: {
                id: userId,
            },
            include: {
                friends: true,
                friendOf: true,
            },
        });

        if (!userWithFriends) {
            throw new Error('User not found');
        }

        // Extract friend IDs from friends and friendOf
        const friendIds = userWithFriends.friends.map(friendship => friendship.friendId);
        const friendOfIds = userWithFriends.friendOf.map(friendship => friendship.userId);

        // Find mutual friends (intersection of friendIds and friendOfIds)
        const mutualFriendIds = friendIds.filter(id => friendOfIds.includes(id));

        // Fetch mutual friends
        const mutualFriends = await prisma.user.findMany({
            where: {
                id: {
                    in: mutualFriendIds,
                },
            },
            take: 20,
        });

        return mutualFriends;
    } catch (error) {
        console.error('Error fetching mutual friends:', error);
        throw error;
    }
};


const getUsersNotInFriendsList = async (userId) => {
    try {
        // Fetch friends and friendsOf
        const userWithFriends = await prisma.user.findUnique({
            where: {
                id: userId,
            },
            include: {
                friends: {
                    select: {
                        friendId: true,
                    },
                },
                friendOf: {
                    select: {
                        userId: true,
                    },
                },
            },
        });

        if (!userWithFriends) {
            throw new Error('User not found');
        }

        // Extract friends' IDs
        const friendIds = [
            ...userWithFriends.friends.map(friendship => friendship.friendId),
        ];

        // Fetch users who are not in the friends list and not the user himself
        const usersNotInFriendsList = await prisma.user.findMany({
            where: {
                id: {
                    notIn: [userId, ...friendIds],
                },
            },
            take: 20,
        });

        return usersNotInFriendsList;
    } catch (error) {
        console.error('Error fetching users not in friends list:', error);
        throw error;
    }
};

const toggleAddFriendRequest = async (userId, friendId) => {
    try {
        await prisma.$transaction(async (tx) => {
            // Check if the friend request already exists
            const existingFriendship = await tx.friend.findFirst({
                where: {
                    userId,
                    friendId,
                },
            });

            if (existingFriendship) {
                // If the friend request exists, remove it
                await tx.friend.delete({
                    where: {
                        id: existingFriendship.id,
                    },
                });
            } else {
                // If the friend request does not exist, add it
                await tx.friend.create({
                    data: {
                        userId,
                        friendId,
                        status: 'PENDING', // Assuming the default status is PENDING
                    },
                });
            }
        });

        return { EC: 0, EM: 'Friend request toggled successfully' };
    } catch (error) {
        // Handle errors
        console.error(error);
        return { EC: -2, EM: 'Internal server error' };
    }
};

const getFriendRequests = async (userId) => {
    try {
        const userWithFriends = await prisma.user.findUnique({
            where: {
                id: userId,
            },
            include: {
                friends: true,
                friendOf: true,
            },
        });

        if (!userWithFriends) {
            throw new Error('User not found');
        }

        // Extract friend IDs from friends and friendOf
        const friendIds = userWithFriends.friends.map(friendship => friendship.friendId);
        const friendOfIds = userWithFriends.friendOf.map(friendship => friendship.userId);

        // Find friend requests (items in friendOf but not in friends)
        const friendRequestsIds = friendOfIds.filter(id => !friendIds.includes(id));

        // Fetch friend requests
        const friendRequests = await prisma.user.findMany({
            where: {
                id: {
                    in: friendRequestsIds,
                },
            },
            take: 20,
            orderBy: {
                createdAt: 'desc' // Assuming createdAt is the attribute indicating when the friend request was made
            }
        });

        return friendRequests;
    } catch (error) {
        console.error('Error fetching friend requests:', error);
        throw error;
    }
};




module.exports = {
    registerUser, loginUser, getFriendsOfUser,
    getUsersNotInFriendsList, getInfoById, toggleAddFriendRequest,
    getFriendRequests
};
