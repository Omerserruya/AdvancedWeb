import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import postModel from "../models/post_model";
import userModel, { IUser } from "../models/user_model";
import { Express } from "express";

var app: Express;
type User = IUser & {
  accessToken?: string,
  refreshToken?: string
};

const adminUser = {
  email: "admin@user.com",
  username: "adminuser",
  password: "adminpassword",
} as User;

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

  // Register and login admin user
  const admin = new userModel({
    username: adminUser.username, // Customize admin name if needed
    email: adminUser.email,
    password: adminUser.password,
    role: "admin",
  });
  await admin.save();
  
  const adminRes = await request(app).post("/auth/login").send(adminUser);
  adminUser.accessToken = adminRes.body.accessToken;
  adminUser.refreshToken = adminRes.body.refreshToken;
console.log("adminres"+ adminRes);
console.log("adminres"+ adminRes.body.refreshToken);


  // Register and login test user
  await request(app).post("/auth/register").send(testUser);
  const user = await userModel.findOne({ email: testUser.email });
  testUser._id = (user?._id as mongoose.Types.ObjectId).toString();
  const testRes = await request(app).post("/auth/login").send(testUser);
  testUser.accessToken = testRes.body.accessToken;
  testUser.refreshToken = testRes.body.refreshToken;
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
    const response = await request(app).post("/posts").set({ authorization: testUser.accessToken + " " + testUser.refreshToken })
      .send({
        title: "Test Post",
        content: "Test Content",
        userID: testUser._id,
      });
    expect(response.statusCode).toBe(201);
    expect(response.body.title).toBe("Test Post");
    expect(response.body.content).toBe("Test Content");
    expect(response.body.userID).toBe(testUser._id);
    postId = response.body._id;
  });

  // test("Test Create Post fail - invalid userID", async () => {
  //   const response = await request(app).post("/posts").set({ authorization: testUser.accessToken + " " + testUser.refreshToken })
  //     .send({
  //       title: "Test Post",
  //       content: "Test Content",
  //       userID: "invalidUserID",
  //     });
  //   expect(response.statusCode).toBe(400);
  // });

  test("Test update post - success", async () => {
    const response = await request(app).put("/posts/" + postId).set({ authorization: testUser.accessToken + " " + testUser.refreshToken })
      .send({
        title: "Updated Test Post",
        content: "Updated Test Content",
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.title).toBe("Updated Test Post");
    expect(response.body.content).toBe("Updated Test Content");
  });

  test("Test update post - fail (not owner)", async () => {
    const response = await request(app).put("/posts/" + postId).set({ authorization: adminUser.accessToken + " " + adminUser.refreshToken })
      .send({
        title: "Updated Test Post",
        content: "Updated Test Content",
      });
    expect(response.statusCode).toBe(403);
    expect(response.body.message).toBe("Access denied");
  });

  test("Test delete post - success (admin)", async () => {
    const response = await request(app).delete("/posts/" + postId).set({ authorization: adminUser.accessToken + " " + adminUser.refreshToken });
    expect(response.statusCode).toBe(200);
  });

  test("Test delete post - fail (not owner)", async () => {
    // Create a new post with testUser
    const createResponse = await request(app).post("/posts").set({ authorization: testUser.accessToken + " " + testUser.refreshToken })
      .send({
        title: "Test Post",
        content: "Test Content",
        userID: testUser._id,
      });
    postId = createResponse.body._id;

    const response = await request(app).delete("/posts/" + postId).set({ authorization: adminUser.accessToken + " " + adminUser.refreshToken });
    expect(response.statusCode).toBe(200);
  });

  test("Test delete post - fail (not owner)", async () => {
    const response = await request(app).delete("/posts/" + postId).set({ authorization: testUser.accessToken + " " + testUser.refreshToken });
    expect(response.statusCode).toBe(403);
    expect(response.body.message).toBe("Access denied");
  });
});