


const postService = require('../services/chatService');

const findChatBetweenUsers = async (req, res) => {
    try {
        const { userId, otherUserId } = req.params;
        const result = await postService.findChatBetweenUsers(+userId, +otherUserId);
        res.status(200).json(result);
    } catch (error) {
        // Send error response
        res.status(500).json(error);
    }
};

module.exports = {
    findChatBetweenUsers,
};
