import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import postModel from "../models/post_model";
import userModel, { IUser }  from "../models/user_model";
import { Express } from "express";

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

beforeAll(async () => {
  console.log("beforeAll");
  app = await initApp();
  await postModel.deleteMany();
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

let postId = "";
describe("Posts Tests", () => {
  test("Posts test get all", async () => {
    const response = await request(app).get("/posts");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(0);
  });

  test("Test Create Post", async () => {
    const response = await request(app).post("/posts").set({authorization: testUser.accessToken + " " + testUser.refreshToken})
    .send({
      title: "Test Post",
      content: "Test Content",
      userID: "676fc94c89d0609a0b797952",
    });
    expect(response.statusCode).toBe(201);
    expect(response.body.title).toBe("Test Post");
    expect(response.body.content).toBe("Test Content");
    expect(response.body.userID).toBe("676fc94c89d0609a0b797952");
    postId = response.body._id;
  });

  test("Test get post by userID", async () => {
    const response = await request(app).get("/posts?userID=676fc94c89d0609a0b797952");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].title).toBe("Test Post");
    expect(response.body[0].content).toBe("Test Content");
    expect(response.body[0].userID).toBe("676fc94c89d0609a0b797952");
  });

  test("Test get post by id", async () => {
    const response = await request(app).get("/posts/" + postId);
    expect(response.statusCode).toBe(200);
    expect(response.body.title).toBe("Test Post");
    expect(response.body.content).toBe("Test Content");
    expect(response.body.userID).toBe("676fc94c89d0609a0b797952");
  });

  test("Test Create Post 2", async () => {
    const response = await request(app).post("/posts").set({authorization: testUser.accessToken + " " + testUser.refreshToken})
    .send({
      title: "Test Post 2",
      content: "Test Content 2",
      userID: "676fc94c89d0609a0b797952",
    });
    expect(response.statusCode).toBe(201);
  });

  test("Posts test get all 2", async () => {
    const response = await request(app).get("/posts");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(2);
  });

  test("Test update", async () => {
    const response = await request(app).put("/posts/" + postId).set({authorization: testUser.accessToken + " " + testUser.refreshToken})
    .send({  
        title: "Test Post 3",
        content: "Test Content 3"        
    });
    expect(response.statusCode).toBe(200);
    const afterresponse = await request(app).get("/posts/" + postId);
    expect(afterresponse.statusCode).toBe(200); 
    expect(afterresponse.body.title).toBe("Test Post 3");
    expect(afterresponse.body.content).toBe("Test Content 3");
  });

  test("Test Delete Post", async () => {
    const response = await request(app).delete("/posts/" + postId)
    .set({authorization: testUser.accessToken + " " + testUser.refreshToken});
    expect(response.statusCode).toBe(200);
    const response2 = await request(app).get("/posts/" + postId);
    expect(response2.statusCode).toBe(404);
  });

  test("Test Create Post fail", async () => {
    const response = await request(app).post("/posts").set({authorization: testUser.accessToken + " " + testUser.refreshToken})
    .send({
      title: "Test Post 2",
      content: "Test Content 2",
    });
    expect(response.statusCode).toBe(400);
  });
});
