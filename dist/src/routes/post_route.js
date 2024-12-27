"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const postsRoute = express_1.default.Router();
const post_controller_1 = __importDefault(require("../controllers/post_controller"));
const comment_controller_1 = __importDefault(require("../controllers/comment_controller"));
postsRoute.post('/', post_controller_1.default.addPost);
postsRoute.get('/', post_controller_1.default.getPost);
postsRoute.get('/:id', post_controller_1.default.getPostById);
postsRoute.put('/:id', post_controller_1.default.updatePost);
postsRoute.delete('/:id', post_controller_1.default.deletePost);
postsRoute.post('/:postID/comments', comment_controller_1.default.createComment);
postsRoute.get('/:postID/comments', comment_controller_1.default.getComments);
postsRoute.get('/:postID/comments/:commentID', comment_controller_1.default.getComments);
postsRoute.put('/:postID/comments/:commentID', comment_controller_1.default.updateComment);
postsRoute.delete('/:postID/comments/:commentID', comment_controller_1.default.deleteComment);
exports.default = postsRoute;
//# sourceMappingURL=post_route.js.map