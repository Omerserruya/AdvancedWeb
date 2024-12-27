import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import postModel from "../models/post_model";
import commentModel from "../models/comment_model";
import { Express } from "express";

var app: Express;
let postId = "";
let commentId = "";

beforeAll(async () => {
    console.log("beforeAll");
    app = await initApp();
    await postModel.deleteMany();
    await commentModel.deleteMany();

});

afterAll((done) => {
    console.log("afterAll");
    mongoose.connection.close();
    done();
});


describe("Comments Tests", () => {
    test("Comments test get all", async () => {
        const response = await request(app).get("/posts");
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(0);
    });

    test("Test Create Comment", async () => {
        const res = await request(app).post("/posts").send({
            title: "Test Post",
            content: "Test Content",
            userID: "TestOwner",
        });
        postId = res.body._id;
        console.log("/posts/" + postId + "/comments");
        const response = await request(app).post("/posts/" + postId + "/comments").send({
            content: "Test Comment",
            userID: "TestOwner"
        });
        expect(response.statusCode).toBe(201);
        expect(response.body.content).toBe("Test Comment");
        expect(response.body.userID).toBe("TestOwner");
        commentId = response.body._id;
    });

    test("Test get comment by userID", async () => {
        const response = await request(app).get("/posts/" + postId + "/comments?userID=TestOwner");
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].content).toBe("Test Comment");
        expect(response.body[0].userID).toBe("TestOwner");
    });

    test("Test get comment by id", async () => {
        const response = await request(app).get("/posts/" + postId + "/comments/" + commentId);
        expect(response.statusCode).toBe(200);
        expect(response.body.content).toBe("Test Comment");
        expect(response.body.userID).toBe("TestOwner");
    });

    test("Test get comment by post id", async () => {
        const response = await request(app).get("/posts/" + postId + "/comments/");
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].content).toBe("Test Comment");
        expect(response.body[0].userID).toBe("TestOwner");
    });

    test("Test Update Comment", async () => {
        const response = await request(app).put("/posts/" + postId + "/comments/" + commentId).send({
            content: "Test Comment Updated",
            userID: "TestOwner",
            postId: postId,
        });
        expect(response.statusCode).toBe(200);
        expect(response.body.content).toBe("Test Comment Updated");
        expect(response.body.userID).toBe("TestOwner");
    });

    test("Test Delete Comment", async () => {
        const response = await request(app).delete("/posts/" + postId + "/comments/" + commentId);
        expect(response.statusCode).toBe(200);
        const response2 = await request(app).get("/posts/" + postId + "/comments/" + commentId);
        expect(response2.statusCode).toBe(404);
    });
});
