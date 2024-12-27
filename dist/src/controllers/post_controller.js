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
const post_model_1 = __importDefault(require("../models/post_model"));
const addPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const postBody = req.body;
    try {
        const post = yield post_model_1.default.create(postBody);
        res.status(201).send(post);
    }
    catch (error) {
        res.status(400).send(error);
    }
});
const getPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const filter = req.query.userID;
    try {
        if (filter) {
            const posts = yield post_model_1.default.find({ userID: filter });
            res.send(posts);
        }
        else {
            const posts = yield post_model_1.default.find();
            res.send(posts);
        }
    }
    catch (error) {
        res.status(400).send(error);
    }
});
const getPostById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const postId = req.params.id;
    try {
        const post = yield post_model_1.default.findById(postId);
        if (post != null) {
            res.send(post);
        }
        else {
            res.status(404).send("Post not found");
        }
    }
    catch (error) {
        res.status(400).send(error);
    }
});
const deletePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const postId = req.params.id;
    try {
        const rs = yield post_model_1.default.findByIdAndDelete(postId);
        res.status(200).send(rs);
    }
    catch (error) {
        res.status(400).send(error);
    }
});
const updatePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const body = req.body;
    try {
        const post = yield post_model_1.default.findById(id);
        if (!post) {
            res.status(404).json({ message: 'Post not found' });
        }
        else {
            const updatedPost = yield post_model_1.default.findByIdAndUpdate(id, { userID: post.userID, title: body.title, content: body.content });
            res.status(200).send(updatedPost);
        }
    }
    catch (error) {
        res.status(500).send(error);
    }
});
exports.default = { addPost, getPost, getPostById, updatePost, deletePost };
//# sourceMappingURL=post_controller.js.map