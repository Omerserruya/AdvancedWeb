"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const commentSchema = new mongoose_1.default.Schema({
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
const commentModel = mongoose_1.default.model("Comment", commentSchema);
exports.default = commentModel;
//# sourceMappingURL=comment_model.js.map