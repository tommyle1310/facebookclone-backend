// userService.js
require('dotenv').config()

const { PrismaClient, SourceType, NotificationTypes, FriendStatus } = require('@prisma/client');
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
                profilePic: process.env.DEFAULT_AVATAR
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
            return { EC: -3, EM: "User not found" };
        }

        // Compare the provided password with the stored password
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return { EC: 2, EM: "Invalid email or password" };
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_KEY);

        // Return success response with token
        return { EC: 0, token, email: user.email, name: user.name, image: user.profilePic, id: user.id };
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
                friends: {
                    where: {
                        status: 'ACCEPTED',
                    },
                },
                friendOf: {
                    where: {
                        status: 'ACCEPTED',
                    },
                },
            },
        });

        if (!userWithFriends) {
            return { EC: -3, EM: "No user was found" };

        }

        // Extract accepted friend IDs from friends and friendOf
        const acceptedFriendIds = userWithFriends.friends.map(friendship => friendship.friendId);
        const acceptedFriendOfIds = userWithFriends.friendOf.map(friendship => friendship.userId);

        // Find mutual friends (intersection of acceptedFriendIds and acceptedFriendOfIds)
        const mutualFriendIds = acceptedFriendIds.filter(id => acceptedFriendOfIds.includes(id));

        // Fetch all friends with status ACCEPTED (both mutual and non-mutual)
        const allAcceptedFriendIds = [...new Set([...acceptedFriendIds, ...acceptedFriendOfIds])];

        // Fetch details of these friends
        const acceptedFriends = await prisma.user.findMany({
            where: {
                id: {
                    in: allAcceptedFriendIds,
                },
            },
            take: 20,
        });

        return acceptedFriends;
    } catch (error) {
        console.error('Error fetching accepted friends:', error);
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
        const fromUser = await prisma.user.findUnique({ where: { id: userId } })
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

                // Create a notification for friend request removal
                await tx.notification.create({
                    data: {
                        message: `Friend request from user ID ${userId} has been canceled.`,
                        type: NotificationTypes.FRIEND_REQUEST,
                        userId: friendId,
                        fromId: friendId,
                        fromType: SourceType.USER
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

                // Create a notification for new friend request
                let message = ''
                await tx.notification.create({
                    data: {
                        message: `sent you a friend request.`,
                        type: NotificationTypes.FRIEND_REQUEST,
                        userId: friendId,
                        fromId: fromUser.id,
                        fromType: SourceType.USER
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

const acceptFriendRequest = async (userId, friendId) => {
    try {
        // Fetch the friend request that needs to be accepted
        const friendRequest = await prisma.friend.findFirst({
            where: {
                userId: friendId,
                friendId: userId,
                status: 'PENDING' // Assuming FriendStatus.PENDING resolves to the string 'PENDING'
            },
        });

        if (!friendRequest) {
            return { EC: -1, EM: 'No pending friend request found' };
        }

        // Fetch the user and friend data
        const [user, friend] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId } }),
            prisma.user.findUnique({ where: { id: friendId } })
        ]);

        if (!user || !friend) {
            return { EC: -1, EM: 'User or friend not found' };
        }

        // Start a transaction
        await prisma.$transaction(async (tx) => {
            // Update the friend request status to ACCEPTED
            await tx.friend.update({
                where: {
                    id: friendRequest.id
                },
                data: {
                    status: 'ACCEPTED' // Assuming FriendStatus.ACCEPTED resolves to the string 'ACCEPTED'
                },
            });

            // Check if the reverse friend entry exists
            const reverseFriendRequest = await tx.friend.findFirst({
                where: {
                    userId: userId,
                    friendId: friendId,
                    status: 'ACCEPTED'
                },
            });

            // If reverse friend entry doesn't exist, create one
            if (!reverseFriendRequest) {
                await tx.friend.create({
                    data: {
                        userId: userId,
                        friendId: friendId,
                        status: 'ACCEPTED'
                    },
                });
            }

            // Create notifications for both users
            await tx.notification.createMany({
                data: [
                    {
                        message: `You have accepted ${friend.name}'s friend request.`,
                        type: 'FRIEND_ACCEPT', // Assuming NotificationTypes.FRIEND_ACCEPT resolves to the string 'FRIEND_ACCEPT'
                        userId: userId,
                        fromId: friendId,
                        fromType: 'USER' // Assuming SourceType.USER resolves to the string 'USER'
                    },
                    {
                        message: `${user.name} has accepted your friend request.`,
                        type: 'FRIEND_ACCEPT', // Assuming NotificationTypes.FRIEND_ACCEPT resolves to the string 'FRIEND_ACCEPT'
                        userId: friendId,
                        fromId: userId,
                        fromType: 'USER' // Assuming SourceType.USER resolves to the string 'USER'
                    }
                ]
            });
        });

        return { EC: 0, EM: 'Friend request accepted successfully' };
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

const editUserAvatar = async (userId, image) => {
    try {
        if (!userId || !image) return { EC: 1, message: "Missing userId or image." };
        // Check if the user exists
        const existingUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!existingUser) {
            // Handle if the user does not exist (create a new user or return an error)
            return { EC: -3, message: "User not found." };
        }

        // Update the user's profile picture with the new image URL
        await prisma.user.update({
            where: { id: userId },
            data: { profilePic: image }
        });

        return { EC: 0, message: "Profile picture updated successfully." };
    } catch (error) {
        // Handle errors
        console.error(error);
        return { EC: -2, message: "Failed to update profile picture." };
    }
};

const getAvatar = async (userId) => {
    try {
        // Fetch the user by ID including required information
        const userInfo = await prisma.user.findUnique({
            where: {
                id: userId,
            },
        });

        // Check if the user exists
        if (!userInfo) {
            throw new Error('User not found');
        }
        return userInfo.profilePic
    } catch (error) {
        console.error('Error fetching user information:', error);
        throw error;
    }
};


module.exports = {
    registerUser, loginUser, getFriendsOfUser,
    getUsersNotInFriendsList, getInfoById, toggleAddFriendRequest,
    getFriendRequests, editUserAvatar, getAvatar,
    acceptFriendRequest
};
