const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    userID: {
        type: String,
        required: true
    }
});
module.exports = mongoose.model('Post', postSchema);