"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const postSchema = new mongoose_1.default.Schema({
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
const postModel = mongoose_1.default.model("Posts", postSchema);
exports.default = postModel;
//# sourceMappingURL=post_model.js.map