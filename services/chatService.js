// chatService.js
require('dotenv').config()

const { PrismaClient, SourceType, NotificationTypes, FriendStatus } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();


// Function to find chat messages between two users
const findChatBetweenUsers = async (userId, otherUserId) => {
    try {
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: userId },
                ],
            },
            include: {
                sender: true,
                receiver: true,
            },
            orderBy: { createdAt: 'asc' },
        });

        return messages;
    } catch (error) {
        console.error('Error fetching messages between users:', error);
        return [];
    }
};



module.exports = {
    findChatBetweenUsers
};
