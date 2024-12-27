import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    userID: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    }
});

const postModel = mongoose.model("Posts", postSchema);

export default postModel;