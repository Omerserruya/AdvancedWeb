"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const comment_model_1 = __importDefault(require("../models/comment_model"));
const comment_model_2 = __importDefault(require("../models/comment_model"));
const post_model_1 = __importDefault(require("../models/post_model"));
const createComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { postID } = req.params;
    const body = req.body;
    try {
        const post = yield post_model_1.default.findById(postID);
        if (!post) {
            res.status(404).json({ message: 'Post not found' });
        }
        else {
            if (!body.content) {
                res.status(400).json({ message: 'Text is required' });
            }
            const savedComment = yield comment_model_2.default.create({ postID: postID, userID: body.userID, content: body.content });
            res.status(201).json(savedComment);
        }
    }
    catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});
const getComments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { postID, commentID } = req.params;
    try {
        let comments;
        const post = yield post_model_1.default.findById(postID);
        if (postID && post) {
            if (commentID) {
                comments = yield comment_model_1.default.findById(commentID);
                if (comments) {
                    res.status(200).json(comments);
                }
                else {
                    res.status(404).json({ message: 'Comment not found' });
                }
            }
            else {
                console.log(post);
                comments = yield comment_model_1.default.find({ postID });
                res.status(200).json(comments);
            }
        }
        else {
            res.status(404).json({ message: 'Post not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Error retrieving comments', error });
    }
});
const updateComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentID } = req.params;
    const { content } = req.body;
    try {
        const comment = yield comment_model_1.default.findById(commentID);
        if (!comment) {
            res.status(404).json({ message: 'Comment not found' });
        }
        else {
            comment.content = content;
            const updatedComment = yield comment.save();
            res.json(updatedComment);
        }
    }
    catch (error) {
        res.status(500).json(error);
    }
});
const deleteComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentID } = req.params;
    try {
        const comment = yield comment_model_1.default.findById(commentID);
        if (!comment) {
            res.status(404).json({ message: 'Comment not found' });
        }
        else {
            yield comment_model_1.default.findByIdAndDelete(commentID);
            res.status(200).json({ message: 'Comment deleted successfully' });
        }
    }
    catch (error) {
        res.status(500).json(error);
    }
});
exports.default = { createComment, getComments, updateComment, deleteComment };
//# sourceMappingURL=comment_controller.js.map