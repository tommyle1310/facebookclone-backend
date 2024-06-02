require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const chatRoutes = require('./routes/chatRoutes');
const { authenticateJWT } = require('./middlewares/authMiddleware');
const { PrismaClient, SourceType, NotificationTypes, FriendStatus } = require('@prisma/client');

const prisma = new PrismaClient();



const PORT = process.env.PORT || 8080 || 8081 || 8082 || 8083;

const app = express();
// Create an HTTP server
const server = http.createServer(app);

// Create a new Socket.IO server
const io = new Server(server, {
    cors: {
        origin: '*', // Adjust this to your frontend URL
        methods: ['GET', 'POST'],
    },
});

// Increase the size limit for JSON payloads
app.use(express.json({ limit: '50mb' }));

// Increase the size limit for URL-encoded payloads
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());
app.use(bodyParser.json());
app.use(authRoutes);
app.use(userRoutes);
app.use(postRoutes);
app.use(chatRoutes);

// Define your routes and middleware here

interface MessageData {
    content: string;
    imageUrl?: string;
    videoUrl?: string;
    senderId: number;
    listReceiverIds?: number[]; // Add list of receiver IDs for multiple recipients
    receiverId?: number; // Single receiver ID for backward compatibility
    type: 'DEFAULT' | 'POST_SHARE' | 'GROUP_INVITE';
    sharedPostId?: number;
}

io.on('connection', async (socket: any) => {
    console.log('A user connected:', socket.id);
    const userId = Number(socket.handshake.query.userId);

    if (!isNaN(userId)) {
        try {
            const messages = await prisma.message.findMany({
                where: {
                    OR: [
                        { senderId: userId },
                        { receiverId: userId },
                    ],
                },
                include: {
                    sender: true,
                    receiver: true,
                    sharedPost: true, // Include the shared post
                },
                orderBy: { createdAt: 'asc' },
            });

            const userMessages: { [key: number]: any[] } = {};
            messages.forEach((message: any) => {
                const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
                if (!userMessages[otherUserId]) {
                    userMessages[otherUserId] = [];
                }
                userMessages[otherUserId].push(message);
            });

            socket.emit('initialMessages', userMessages);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    } else {
        console.error('Invalid userId:', userId);
    }

    socket.on('message', async (data: MessageData) => {
        console.log('Message received:', data);

        try {
            if (data.type === 'POST_SHARE' && data.listReceiverIds) {
                // Handle bulk message creation for multiple receivers
                const newMessages = await prisma.$transaction(
                    data.listReceiverIds.map(receiverId => prisma.message.create({
                        data: {
                            content: data.content,
                            imageUrl: data.imageUrl || null,
                            videoUrl: data.videoUrl || null,
                            senderId: data.senderId,
                            receiverId: receiverId,
                            type: data.type,
                            sharedPostId: data.sharedPostId, // Reference to the shared post
                        },
                        include: {
                            sender: true,
                            receiver: true,
                            sharedPost: true, // Include the shared post
                        },
                    }))
                );

                // Emit the messages to all relevant clients
                newMessages.forEach((newMessage: any) => {
                    io.emit('message', newMessage);
                });
            } else {
                // Handle single message creation
                const newMessage = await prisma.message.create({
                    data: {
                        content: data.content,
                        imageUrl: data.imageUrl || null,
                        videoUrl: data.videoUrl || null,
                        senderId: data.senderId,
                        receiverId: data.receiverId!,
                        type: data.type,
                    },
                    include: {
                        sender: true,
                        receiver: true,
                    },
                });

                io.emit('message', newMessage);
            }
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });
});



// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
