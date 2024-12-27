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
const supertest_1 = __importDefault(require("supertest"));
const server_1 = __importDefault(require("../server"));
const mongoose_1 = __importDefault(require("mongoose"));
const post_model_1 = __importDefault(require("../models/post_model"));
const comment_model_1 = __importDefault(require("../models/comment_model"));
var app;
let postId = "";
let commentId = "";
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log("beforeAll");
    app = yield (0, server_1.default)();
    yield post_model_1.default.deleteMany();
    yield comment_model_1.default.deleteMany();
}));
afterAll((done) => {
    console.log("afterAll");
    mongoose_1.default.connection.close();
    done();
});
describe("Comments Tests", () => {
    test("Comments test get all", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).get("/posts");
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(0);
    }));
    test("Test fail Create Comment", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app).post("/posts").send({
            title: "Test Post",
            content: "Test Content",
            userID: "TestOwner",
        });
        postId = res.body._id;
        const response = yield (0, supertest_1.default)(app).post("/posts/" + postId + "/comments").send({
            userID: "TestOwner"
        });
        expect(response.statusCode).toBe(500);
    }));
    test("Test fail Create Comment", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app).post("/posts").send({
            title: "Test Post",
            content: "Test Content",
            userID: "TestOwner",
        });
        postId = res.body._id;
        const response = yield (0, supertest_1.default)(app).post("/posts/123456123456789123456789/comments").send({
            content: "Test Comment",
            userID: "TestOwner"
        });
        expect(response.statusCode).toBe(404);
    }));
    test("Test Create Comment", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app).post("/posts").send({
            title: "Test Post",
            content: "Test Content",
            userID: "TestOwner",
        });
        postId = res.body._id;
        const response = yield (0, supertest_1.default)(app).post("/posts/" + postId + "/comments").send({
            content: "Test Comment",
            userID: "TestOwner"
        });
        expect(response.statusCode).toBe(201);
        expect(response.body.content).toBe("Test Comment");
        expect(response.body.userID).toBe("TestOwner");
        commentId = response.body._id;
    }));
    test("Test get comment by userID", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).get("/posts/" + postId + "/comments?userID=TestOwner");
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].content).toBe("Test Comment");
        expect(response.body[0].userID).toBe("TestOwner");
    }));
    test("Test get comment by userID", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).get("/posts/" + postId + "/comments?userID=TestOwner");
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].content).toBe("Test Comment");
        expect(response.body[0].userID).toBe("TestOwner");
    }));
    test("Test fail get comment ", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).get("/posts/" + "676ecd61234ebc60768320af" + "/comments/" + commentId);
        expect(response.statusCode).toBe(404);
    }));
    test("Test  get comment by id", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).get("/posts/" + postId + "/comments/" + commentId);
        expect(response.statusCode).toBe(200);
    }));
    test("Test fail get comment ", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).get("/posts/error/comments/" + commentId);
        expect(response.statusCode).toBe(500);
    }));
    test("Test get comment by post id", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).get("/posts/" + postId + "/comments/");
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].content).toBe("Test Comment");
        expect(response.body[0].userID).toBe("TestOwner");
    }));
    test("Test Update Comment", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).put("/posts/" + postId + "/comments/" + commentId).send({
            content: "Test Comment Updated",
            userID: "TestOwner",
            postId: postId,
        });
        expect(response.statusCode).toBe(200);
        expect(response.body.content).toBe("Test Comment Updated");
        expect(response.body.userID).toBe("TestOwner");
    }));
    test("Test fail to update comment by id", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).put("/posts/" + postId + "/comments/" + commentId).send({
            text: "Test Comment Updated",
        });
        expect(response.statusCode).toBe(500);
    }));
    test("Test fail to update comment by id", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).put("/posts/" + postId + "/comments/" + postId).send({
            content: "Test Comment Updated",
            userID: "TestOwner",
            postId: postId,
        });
        expect(response.statusCode).toBe(404);
    }));
    test("Test Delete Comment", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).delete("/posts/" + postId + "/comments/" + commentId);
        expect(response.statusCode).toBe(200);
        const response2 = yield (0, supertest_1.default)(app).get("/posts/" + postId + "/comments/" + commentId);
        expect(response2.statusCode).toBe(404);
    }));
    test("Test faile to Delete comment", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).delete("/posts/" + postId + "/comments/" + commentId);
        expect(response.statusCode).toBe(404);
    }));
    test("Test faile to delete comment by id", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).delete("/posts/" + postId + "/comments/" + null);
        expect(response.statusCode).toBe(500);
    }));
});
//# sourceMappingURL=comments.test.js.map