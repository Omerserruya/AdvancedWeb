const moongoose = require('mongoose');

const postSchema = new moongoose.Schema({
    message: {
        type: String,
        required: true
    },
    sender: {
        type: String,
        required: true
    }
});
module.exports = moongoose.model('Post', postSchema);