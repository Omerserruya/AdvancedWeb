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

const testUser = {
  email: "test@user.com",
  username: "testuser",
  password: "testpassword",
} as User;

let postId = ""; // Variable to store the ID of a created post

beforeAll(async () => {
  app = await initApp();
  await postModel.deleteMany();
  await userModel.deleteMany();

  // Register and login test user
  await request(app).post("/auth/register").send(testUser);
  const user = await userModel.findOne({ email: testUser.email });
  testUser._id = (user?._id as mongoose.Types.ObjectId).toString();
  const testRes = await request(app).post("/auth/login").send(testUser);
  expect(testRes.statusCode).toBe(200);
    
  expect(testRes.headers['set-cookie']).toBeDefined();
  const cookies = testRes.headers['set-cookie'] as unknown as string[];

  // Assuming cookies contain accessToken and refreshToken
  const accessToken = cookies.find(cookie => cookie.startsWith('accessToken=')) as string;
  const refreshToken = cookies.find(cookie => cookie.startsWith('refreshToken=')) as string;

  // Extract the token values from the cookie strings (cookie format is "cookieName=value; ...")
  const accessTokenValue = accessToken.split(';')[0].split('=')[1];
  const refreshTokenValue = refreshToken.split(';')[0].split('=')[1];

  expect(accessTokenValue).toBeDefined();
  expect(refreshTokenValue).toBeDefined();
  
  testUser.accessToken = accessTokenValue;
  testUser.refreshToken = refreshTokenValue;

});

afterAll((done) => {
  mongoose.connection.close();
  done();
});

describe("Posts Tests", () => {
  test("Posts test get all", async () => {
    const response = await request(app).get("/posts");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(0);
  });

  test("Test Create Post", async () => {
    const response = await request(app).post("/posts").set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`])
      .send({
        title: "Test Post",
        content: "Test Content",
        userID: testUser._id,
      });
    expect(response.statusCode).toBe(201);
    expect(response.body.title).toBe("Test Post");
    expect(response.body.content).toBe("Test Content");
    expect(response.body.userID).toBe(testUser._id);
    postId = response.body._id.toString(); // Store the post ID for later tests
  });

  test("Test Create Post - Error", async () => {
    jest.spyOn(postModel, 'create').mockImplementationOnce(() => {
      throw new Error("Create post error");
    });

    const response = await request(app).post("/posts").set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`])
      .send({
        title: "Test Post",
        content: "Test Content",
        userID: testUser._id,
      });
    expect(response.statusCode).toBe(400);
  });

  test("Test Get Posts with Filter", async () => {
    const response = await request(app).get("/posts").query({ userID: testUser._id });
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBeGreaterThanOrEqual(0);
  });

  test("Test Get Posts - Error", async () => {
    jest.spyOn(postModel, 'find').mockImplementationOnce(() => {
      throw new Error("Get posts error");
    });

    const response = await request(app).get("/posts");
    expect(response.statusCode).toBe(500);
  });

  test("Test Get Post By ID - Success", async () => {
    // Create a new post
    const createResponse = await request(app).post("/posts").set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`])
      .send({
        title: "Test Post",
        content: "Test Content",
        userID: testUser._id,
      });
    expect(createResponse.statusCode).toBe(201);
    const newPostId = createResponse.body._id;
  
    // Get the created post by ID
    const response = await request(app).get(`/posts/${newPostId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body._id).toBe(newPostId);
  });

  test("Test Get Post By ID - Not Found", async () => {
    const nonExistentPostId = new mongoose.Types.ObjectId().toString();
    const response = await request(app).get(`/posts/${nonExistentPostId}`);
    expect(response.statusCode).toBe(404);
    expect(response.text).toBe("Post not found");
  });

  test("Test Get Post By ID - Error", async () => {
    jest.spyOn(postModel, 'findById').mockImplementationOnce(() => {
      throw new Error("Get post by ID error");
    });

    const response = await request(app).get(`/posts/${postId}`);
    expect(response.statusCode).toBe(400);
  });

  test("Test update post - success", async () => {
    expect(postId).toBeDefined(); // Ensure postId is defined
    const response = await request(app).put("/posts/" + postId).set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`])
      .send({
        title: "Updated Test Post",
        content: "Updated Test Content",
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.title).toBe("Updated Test Post");
    expect(response.body.content).toBe("Updated Test Content");
  });

  test("Test delete post - success", async () => {
    expect(postId).toBeDefined(); // Ensure postId is defined
    const response = await request(app).delete("/posts/" + postId).set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`]);
    expect(response.statusCode).toBe(200);
  });

  test("Test delete post - fail (not owner)", async () => {
    // Create a new post with testUser
    const createResponse = await request(app).post("/posts").set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`])
      .send({
        title: "Test Post",
        content: "Test Content",
        userID: testUser._id,
      });
    const newPostId = createResponse.body._id;

    // Register and login a different user
    const otherUser = {
      email: "other@user.com",
      username: "otheruser",
      password: "otherpassword",
    } as User;
    await request(app).post("/auth/register").send(otherUser);
    const otherUserRes = await request(app).post("/auth/login").send(otherUser);
    expect(otherUserRes.statusCode).toBe(200);
    
    expect(otherUserRes.headers['set-cookie']).toBeDefined();
    const cookies = otherUserRes.headers['set-cookie'] as unknown as string[];
  
    // Assuming cookies contain accessToken and refreshToken
    const accessToken = cookies.find(cookie => cookie.startsWith('accessToken=')) as string;
    const refreshToken = cookies.find(cookie => cookie.startsWith('refreshToken=')) as string;
  
    // Extract the token values from the cookie strings (cookie format is "cookieName=value; ...")
    const accessTokenValue = accessToken.split(';')[0].split('=')[1];
    const refreshTokenValue = refreshToken.split(';')[0].split('=')[1];
  
    expect(accessTokenValue).toBeDefined();
    expect(refreshTokenValue).toBeDefined();
    
    otherUser.accessToken = accessTokenValue;
    otherUser.refreshToken = refreshTokenValue;
    const response = await request(app).delete("/posts/" + newPostId).set('Cookie',[`accessToken=${otherUser.accessToken};refreshToken=${otherUser.refreshToken}`]);
    expect(response.statusCode).toBe(403);
    expect(response.body.message).toBe("Access denied");
  });
  
  test("Test delete post - post not found", async () => {
    // Attempt to delete a non-existent post
    const nonExistentPostId = new mongoose.Types.ObjectId().toString();
    const deleteResponse = await request(app).delete(`/posts/${nonExistentPostId}`).set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`]).send({ userId: testUser._id });
    expect(deleteResponse.statusCode).toBe(404);
    expect(deleteResponse.body.message).toBe('Post not found');
  });
  
  test("Test delete post - error", async () => {
    // Create a new post
    const createResponse = await request(app).post("/posts").set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`])
      .send({
        title: "Test Post",
        content: "Test Content",
        userID: testUser._id,
      });
    expect(createResponse.statusCode).toBe(201);
    const newPostId = createResponse.body._id;
  
    // Mock an error during post deletion
    jest.spyOn(postModel, 'findByIdAndDelete').mockImplementationOnce(() => {
      throw new Error("Error deleting post");
    });
  
    const deleteResponse = await request(app).delete(`/posts/${newPostId}`).set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`]).send({ userId: testUser._id });
    expect(deleteResponse.statusCode).toBe(500);
    expect(deleteResponse.body.message).toBe("Error deleting post");
  });

  test("Test update post - post not found", async () => {
    // Attempt to update a non-existent post
    const nonExistentPostId = new mongoose.Types.ObjectId().toString();
    const response = await request(app).put(`/posts/${nonExistentPostId}`).set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`])
      .send({
        title: "Updated Test Post",
        content: "Updated Test Content",
        userID: testUser._id,
      });
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe('Post not found');
  });
  
  test("Test update post - access denied", async () => {
    // Create a new post with testUser
    const createResponse = await request(app).post("/posts").set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`])
      .send({
        title: "Test Post",
        content: "Test Content",
        userID: testUser._id,
      });
    expect(createResponse.statusCode).toBe(201);
    const newPostId = createResponse.body._id;
  
    // Register and login a different user
    const otherUser = {
      email: "other@user.com",
      username: "otheruser",
      password: "otherpassword",
    } as User;
    await request(app).post("/auth/register").send(otherUser);
    const otherUserRes = await request(app).post("/auth/login").send(otherUser);
    expect(otherUserRes.statusCode).toBe(200);
    
    expect(otherUserRes.headers['set-cookie']).toBeDefined();
    const cookies = otherUserRes.headers['set-cookie'] as unknown as string[];
  
    // Assuming cookies contain accessToken and refreshToken
    const accessToken = cookies.find(cookie => cookie.startsWith('accessToken=')) as string;
    const refreshToken = cookies.find(cookie => cookie.startsWith('refreshToken=')) as string;
  
    // Extract the token values from the cookie strings (cookie format is "cookieName=value; ...")
    const accessTokenValue = accessToken.split(';')[0].split('=')[1];
    const refreshTokenValue = refreshToken.split(';')[0].split('=')[1];
  
    expect(accessTokenValue).toBeDefined();
    expect(refreshTokenValue).toBeDefined();
    
    otherUser.accessToken = accessTokenValue;
    otherUser.refreshToken = refreshTokenValue;
    // Attempt to update the post with a different user
    const response = await request(app).put(`/posts/${newPostId}`).set('Cookie',[`accessToken=${otherUser.accessToken};refreshToken=${otherUser.refreshToken}`])
      .send({
        title: "Updated Test Post",
        content: "Updated Test Content",
        userID: otherUser._id,
      });
    expect(response.statusCode).toBe(403);
    expect(response.text).toBe("Access denied");
  });
  
  test("Test update post - error", async () => {
    // Create a new post
    const createResponse = await request(app).post("/posts").set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`])
      .send({
        title: "Test Post",
        content: "Test Content",
        userID: testUser._id,
      });
    expect(createResponse.statusCode).toBe(201);
    const newPostId = createResponse.body._id;
  
    // Mock an error during post update
    jest.spyOn(postModel, 'findByIdAndUpdate').mockImplementationOnce(() => {
      throw new Error("Error updating post");
    });
  
    const response = await request(app).put(`/posts/${newPostId}`).set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`])
      .send({
        title: "Updated Test Post",
        content: "Updated Test Content",
      });
    expect(response.statusCode).toBe(500);
  });
});