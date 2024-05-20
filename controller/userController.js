const userService = require('../services/userService');

const registerUser = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const result = await userService.registerUser(email, password, name);
        res.status(200).json(result);
    } catch (error) {
        // Send error response
        res.status(500).json(error);
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await userService.loginUser(email, password);
        res.status(200).json(result);
    } catch (error) {
        // Send error response
        res.status(error.code || 500).json({ error: error.message });
    }
};

const getInfoById = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await userService.getInfoById(+userId);
        res.status(200).json(result);
    } catch (error) {
        // Send error response
        res.status(error.code || 500).json({ error: error.message });
    }
}


const getFriendsOfUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await userService.getFriendsOfUser(+userId);
        res.status(200).json(result);
    } catch (error) {
        // Send error response
        res.status(error.code || 500).json({ error: error.message });
    }
}

const getUsersNotInFriendsList = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await userService.getUsersNotInFriendsList(+userId);
        res.status(200).json(result);
    } catch (error) {
        // Send error response
        res.status(error.code || 500).json({ error: error.message });
    }
}

const toggleAddFriendRequest = async (req, res) => {
    try {
        const { userId, friendId } = req.params;
        const result = await userService.toggleAddFriendRequest(+userId, +friendId);
        res.status(200).json(result);
    } catch (error) {
        // Send error response
        res.status(error.code || 500).json({ error: error.message });
    }
}

const getFriendRequests = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await userService.getFriendRequests(+userId);
        res.status(200).json(result);
    } catch (error) {
        // Send error response
        res.status(error.code || 500).json({ error: error.message });
    }
}

const editUserAvatar = async (req, res) => {
    try {
        const { userId, image } = req.body;
        const result = await userService.editUserAvatar(+userId, image);
        res.status(200).json(result);
    } catch (error) {
        // Send error response
        res.status(error.code || 500).json({ error: error.message });
    }
}

const getAvatar = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await userService.getAvatar(+userId);
        res.status(200).json(result);
    } catch (error) {
        // Send error response
        res.status(error.code || 500).json({ error: error.message });
    }
}

const acceptFriendRequest = async (req, res) => {
    try {
        const { userId, friendId } = req.body;
        const result = await userService.acceptFriendRequest(+userId, +friendId);
        res.status(200).json(result);
    } catch (error) {
        // Send error response
        res.status(error.code || 500).json({ error: error.message });
    }
}


module.exports = {
    registerUser, loginUser, getFriendsOfUser,
    getUsersNotInFriendsList, getInfoById, toggleAddFriendRequest,
    getFriendRequests, editUserAvatar, getAvatar, acceptFriendRequest
};
