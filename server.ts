require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
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

// Define your routes and middleware here

// Handle Socket.IO connections
io.on('connection', async (socket: any) => {
    console.log('A user connected:', socket.id);

    // Extract userId from socket handshake query or other auth mechanism
    const userId = Number(socket.handshake.query.userId);

    // Fetch and send previous messages to the connected user
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
                },
                orderBy: { createdAt: 'asc' },
            });

            // Separate messages into arrays based on senderId and receiverId
            const userMessages: { [key: number]: any[] } = {}; // Type declaration for userMessages
            messages.forEach((message: any) => {
                const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
                if (!userMessages[otherUserId]) {
                    userMessages[otherUserId] = [];
                }
                userMessages[otherUserId].push(message);
            });

            // Emit the structured messages to the connected user
            socket.emit('initialMessages', userMessages);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    } else {
        console.error('Invalid userId:', userId);
    }

    // Listen for new messages
    socket.on('message', async (data: any) => {
        console.log('Message received:', data);

        // Save the message to the database
        try {
            const newMessage = await prisma.message.create({
                data: {
                    content: data.content,
                    imageUrl: data.imageUrl || null,
                    videoUrl: data.videoUrl || null,
                    senderId: data.senderId,
                    receiverId: data.receiverId,
                    createdAt: new Date(),
                },
                include: {
                    sender: true,
                    receiver: true,
                },
            });

            // Emit the message to all relevant clients
            io.emit('message', newMessage);
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });

    // Handle disconnections
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });
});


// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
