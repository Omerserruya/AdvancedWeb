import mongoose from "mongoose";

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

const commentModel = mongoose.model("Comment", commentSchema);

export default commentModel;