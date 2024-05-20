const postService = require('../services/postService');

const createPost = async (req, res) => {
    try {
        const { userId, postData } = req.body;
        const result = await postService.createPost(userId, postData);
        res.status(200).json(result);
    } catch (error) {
        // Send error response
        res.status(500).json(error);
    }
};


const getAllPosts = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('idd:', userId);
        const result = await postService.getAllPosts(+userId);
        res.status(200).json(result);
    } catch (error) {
        // Send error response
        res.status(500).json(error);
    }
};


module.exports = {
    createPost, getAllPosts
};
