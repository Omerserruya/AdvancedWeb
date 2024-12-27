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
var app;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log("beforeAll");
    app = yield (0, server_1.default)();
    yield post_model_1.default.deleteMany();
}));
afterAll((done) => {
    console.log("afterAll");
    mongoose_1.default.connection.close();
    done();
});
let postId = "";
describe("Posts Tests", () => {
    test("Posts test get all", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).get("/posts");
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(0);
    }));
    test("Test Create Post", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post("/posts").send({
            title: "Test Post",
            content: "Test Content",
            sender: "TestOwner",
        });
        expect(response.statusCode).toBe(201);
        expect(response.body.title).toBe("Test Post");
        expect(response.body.content).toBe("Test Content");
        expect(response.body.sender).toBe("TestOwner");
        postId = response.body._id;
    }));
    test("Test get post by sender", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).get("/posts?sender=TestOwner");
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].title).toBe("Test Post");
        expect(response.body[0].content).toBe("Test Content");
        expect(response.body[0].sender).toBe("TestOwner");
    }));
    test("Test get post by id", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).get("/posts/" + postId);
        expect(response.statusCode).toBe(200);
        expect(response.body.title).toBe("Test Post");
        expect(response.body.content).toBe("Test Content");
        expect(response.body.sender).toBe("TestOwner");
    }));
    test("Test Create Post 2", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post("/posts").send({
            title: "Test Post 2",
            content: "Test Content 2",
            sender: "TestOwner2",
        });
        expect(response.statusCode).toBe(201);
    }));
    test("Posts test get all 2", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).get("/posts");
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(2);
    }));
    test("Test update", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).put("/posts/" + postId).send({
            title: "Test Post 3",
            content: "Test Content 3"
        });
        expect(response.statusCode).toBe(200);
        const afterresponse = yield (0, supertest_1.default)(app).get("/posts/" + postId);
        expect(afterresponse.statusCode).toBe(200);
        expect(afterresponse.body.title).toBe("Test Post 3");
        expect(afterresponse.body.content).toBe("Test Content 3");
    }));
    test("Test Delete Post", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).delete("/posts/" + postId);
        expect(response.statusCode).toBe(200);
        const response2 = yield (0, supertest_1.default)(app).get("/posts/" + postId);
        expect(response2.statusCode).toBe(404);
    }));
    test("Test Create Post fail", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post("/posts").send({
            title: "Test Post 2",
            content: "Test Content 2",
        });
        expect(response.statusCode).toBe(400);
    }));
});
//# sourceMappingURL=posts.js.map