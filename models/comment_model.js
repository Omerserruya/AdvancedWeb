const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    postID: {
        type: String,
        required: true
    },
    userID: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now // Sets the default value to the current date
    }
});
module.exports = mongoose.model('Comment', commentSchema);