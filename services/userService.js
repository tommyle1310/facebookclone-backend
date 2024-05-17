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

const getFriendsOfUser = async (userId) => {
    try {
        const userWithFriends = await prisma.user.findUnique({
            where: {
                id: userId,
            },
            include: {
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
            },
        });

        if (!userWithFriends) {
            throw new Error('User not found');
        }

        // Combine friends and friendsOf, then apply the limit
        const friends = [
            ...userWithFriends.friends.map(friendship => friendship.friend),
            ...userWithFriends.friendOf.map(friendship => friendship.user),
        ].slice(0, 20);

        return friends;
    } catch (error) {
        console.error('Error fetching friends:', error);
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
            ...userWithFriends.friendOf.map(friendship => friendship.userId),
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



module.exports = { registerUser, loginUser, getFriendsOfUser, getUsersNotInFriendsList };
