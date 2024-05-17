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
        return { EC: 0, token };
    } catch (error) {
        // Handle errors
        console.error(error);
        return { EC: -2, EM: 'Internal server error' };
    }
};

module.exports = { registerUser, loginUser };
