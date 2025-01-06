import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import postModel from "../models/post_model";
import commentModel from "../models/comment_model";
import { Express } from "express";
import { text } from "body-parser";
import userModel, { IUser }  from "../models/user_model";


var app: Express;
type User = IUser & {
  accessToken?: string,
  refreshToken?: string
};

const testUser = {
  email: "test@user.com",
  username: "testuser",
  password: "testpassword",
} as User;

let postId = "";
let commentId = "";

beforeAll(async () => {
    console.log("beforeAll");
    app = await initApp();
    await postModel.deleteMany();
    await commentModel.deleteMany();
    await userModel.deleteMany();
    await request(app).post("/auth/register").send(testUser);
    const res = await request(app).post("/auth/login").send(testUser);
    const accessToken = res.body.accessToken;
    const refreshToken = res.body.refreshToken;
    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();
    testUser.accessToken = accessToken;
    testUser.refreshToken = refreshToken;
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
    test("Test fail Create Comment", async () => {
        const res = await request(app).post("/posts").set({authorization: testUser.accessToken + " " + testUser.refreshToken})
        .send({
            title: "Test Post",
            content: "Test Content",
            userID: "TestOwner",
        });
        postId = res.body._id;
        const response = await request(app).post("/posts/" + postId + "/comments").set({authorization: testUser.accessToken + " " + testUser.refreshToken})
        .send({
            
            userID: "TestOwner"
        });
        expect(response.statusCode).toBe(500);
    });
    test("Test fail Create Comment", async () => {
        const res = await request(app).post("/posts").set({authorization: testUser.accessToken + " " + testUser.refreshToken})
        .send({
            title: "Test Post",
            content: "Test Content",
            userID: "TestOwner",
        });
        postId = res.body._id;
        const response = await request(app).post("/posts/123456123456789123456789/comments").set({authorization: testUser.accessToken + " " + testUser.refreshToken})
        .send({
            content: "Test Comment",
            userID: "TestOwner"
        });
        expect(response.statusCode).toBe(404);

    });
    test("Test Create Comment", async () => {
        const res = await request(app).post("/posts").set({authorization: testUser.accessToken + " " + testUser.refreshToken})
        .send({
            title: "Test Post",
            content: "Test Content",
            userID: "TestOwner",
        });
        postId = res.body._id;
        const response = await request(app).post("/posts/" + postId + "/comments").set({authorization: testUser.accessToken + " " + testUser.refreshToken})
        .send({
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
    test("Test get comment by userID", async () => {
        const response = await request(app).get("/posts/" + postId + "/comments?userID=TestOwner");
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].content).toBe("Test Comment");
        expect(response.body[0].userID).toBe("TestOwner");
    });
    test("Test fail get comment ", async () => {
        const response = await request(app).get("/posts/" + "676ecd61234ebc60768320af" + "/comments/" + commentId);
        expect(response.statusCode).toBe(404);

    });
    test("Test  get comment by id", async () => {
        const response = await request(app).get("/posts/" + postId + "/comments/" + commentId);
        expect(response.statusCode).toBe(200);

    });
    test("Test fail get comment ", async () => {
        const response = await request(app).get("/posts/error/comments/" + commentId);
        expect(response.statusCode).toBe(500);
    });
    test("Test get comment by post id", async () => {
        const response = await request(app).get("/posts/" + postId + "/comments/");
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].content).toBe("Test Comment");
        expect(response.body[0].userID).toBe("TestOwner");
    });
    test("Test Update Comment", async () => {
        const response = await request(app).put("/posts/" + postId + "/comments/" + commentId).set({authorization: testUser.accessToken + " " + testUser.refreshToken})
        .send({
            content: "Test Comment Updated",
            userID: "TestOwner",
            postId: postId,
        });
        expect(response.statusCode).toBe(200);
        expect(response.body.content).toBe("Test Comment Updated");
        expect(response.body.userID).toBe("TestOwner");
    });
    test("Test fail to update comment by id", async () => {
        const response = await request(app).put("/posts/" + postId + "/comments/" + commentId).set({authorization: testUser.accessToken + " " + testUser.refreshToken})
        .send({
            text: "Test Comment Updated",
        });
        expect(response.statusCode).toBe(500);
    });
    test("Test fail to update comment by id", async () => {
        const response = await request(app).put("/posts/" + postId + "/comments/"+postId).set({authorization: testUser.accessToken + " " + testUser.refreshToken})
        .send({
            content: "Test Comment Updated",
            userID: "TestOwner",
            postId: postId,
        });
        expect(response.statusCode).toBe(404);
    });
    test("Test Delete Comment", async () => {
        const response = await request(app).delete("/posts/" + postId + "/comments/" + commentId)
        .set({authorization: testUser.accessToken + " " + testUser.refreshToken});
        expect(response.statusCode).toBe(200);
        const response2 = await request(app).get("/posts/" + postId + "/comments/" + commentId);
        expect(response2.statusCode).toBe(404);
    });
    test("Test fail to Delete comment", async () => {
        const response = await request(app).delete("/posts/" + postId + "/comments/" + commentId)
        .set({authorization: testUser.accessToken + " " + testUser.refreshToken});
        expect(response.statusCode).toBe(404);
    });

    test("Test fail to delete comment by id", async () => {
        const response = await request(app).delete("/posts/" + postId + "/comments/" + null)
        .set({authorization: testUser.accessToken + " " + testUser.refreshToken});
        expect(response.statusCode).toBe(500);
    });

});
