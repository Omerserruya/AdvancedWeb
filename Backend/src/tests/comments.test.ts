import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import postModel from "../models/post_model";
import commentModel from "../models/comment_model";
import { Express } from "express";
import userModel, { IUser } from "../models/user_model";

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
  app = await initApp();
  await postModel.deleteMany();
  await commentModel.deleteMany();
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


  // Create a test post
  const postResponse = await request(app)
    .post("/posts")
    .set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`])
    .send({
      title: "Test Post",
      content: "Test Content",
      userID: testUser._id
    });
  postId = postResponse.body._id;
});

afterAll((done) => {
  mongoose.connection.close();
  done();
});

describe("Comments Tests", () => {
  test("Test Create Comment", async () => {
    const response = await request(app)
      .post(`/posts/${postId}/comments`)
      .set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`])
      .send({
        content: "Test Comment"
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.content).toBe("Test Comment");
    expect(response.body.userID).toBe(testUser._id);
    commentId = response.body._id;
  });

  test("Test Create Comment - Post Not Found", async () => {
    const fakePostId = new mongoose.Types.ObjectId().toString();
    const response = await request(app)
      .post(`/posts/${fakePostId}/comments`)
      .set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`])
      .send({
        content: "Test Comment"
      });

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("Post not found");
  });

  test("Test Create Comment - Error", async () => {
    jest.spyOn(commentModel, 'create').mockImplementationOnce(() => {
      throw new Error("Error creating comment");
    });

    const response = await request(app)
      .post(`/posts/${postId}/comments`)
      .set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`])
      .send({
        content: "Test Comment"
      });

    expect(response.statusCode).toBe(500);
  });

  test("Test Get Comments by Post", async () => {
    const response = await request(app)
      .get(`/posts/${postId}/comments`);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  test("Test Get Single Comment", async () => {
    const response = await request(app)
      .get(`/posts/${postId}/comments/${commentId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body._id).toBe(commentId);
  });

  test("Test Get Single Comment - Not Found", async () => {
    const nonExistentCommentId = new mongoose.Types.ObjectId().toString();
    const response = await request(app)
      .get(`/posts/${postId}/comments/${nonExistentCommentId}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe('Comment not found');
  });

  test("Test Get Comments - Post Not Found", async () => {
    const fakePostId = new mongoose.Types.ObjectId().toString();
    const response = await request(app)
      .get(`/posts/${fakePostId}/comments`);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe('Post not found');
  });

  test("Test Get Comments - Error", async () => {
    jest.spyOn(postModel, 'findById').mockImplementationOnce(() => {
      throw new Error("Error retrieving comments");
    });

    const response = await request(app)
      .get(`/posts/${postId}/comments`);

    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe('Error retrieving comments');
  });

  test("Test Update Comment - Success", async () => {
    const response = await request(app)
      .put(`/posts/${postId}/comments/${commentId}`)
      .set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`])
      .send({
        content: "Updated Comment"
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.content).toBe("Updated Comment");
  });

  test("Test Update Comment - Comment Not Found", async () => {
    const nonExistentCommentId = new mongoose.Types.ObjectId().toString();
    const response = await request(app)
      .put(`/posts/${postId}/comments/${nonExistentCommentId}`)
      .set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`])
      .send({
        content: "Updated Comment"
      });

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe('Comment not found');
  });

  test("Test Update Comment - Error", async () => {
    jest.spyOn(commentModel, 'findById').mockImplementationOnce(() => {
      throw new Error("Error updating comment");
    });

    const response = await request(app)
      .put(`/posts/${postId}/comments/${commentId}`)
      .set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`])
      .send({
        content: "Updated Comment"
      });

    expect(response.statusCode).toBe(500);
  });

  test("Test Update Comment - Access Denied", async () => {
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

    const response = await request(app)
      .put(`/posts/${postId}/comments/${commentId}`)
      .set('Cookie',[`accessToken=${otherUser.accessToken};refreshToken=${otherUser.refreshToken}`])
      .send({
        content: "Updated Comment"
      });

    expect(response.statusCode).toBe(403);
    expect(response.body.message).toBe("Access denied");
  });

  test("Test Delete Comment - Comment Not Found", async () => {
    const nonExistentCommentId = new mongoose.Types.ObjectId().toString();
    const response = await request(app)
      .delete(`/posts/${postId}/comments/${nonExistentCommentId}`)
      .set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`]);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe('Comment not found');
  });

  

  test("Test Delete Comment - Access Denied", async () => {
    // Create a new comment with testUser
    const createResponse = await request(app)
      .post(`/posts/${postId}/comments`)
      .set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`])
      .send({
        content: "Test Comment"
      });
    const newCommentId = createResponse.body._id;

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

    // Attempt to delete the comment with a different user
    const deleteResponse = await request(app)
      .delete(`/posts/${postId}/comments/${newCommentId}`)
      .set('Cookie',[`accessToken=${otherUser.accessToken};refreshToken=${otherUser.refreshToken}`])

    expect(deleteResponse.statusCode).toBe(403);
    expect(deleteResponse.body.message).toBe('Access denied');
  });

  test("Test Delete Comment - Error", async () => {
    // Create a new comment
    const createResponse = await request(app)
      .post(`/posts/${postId}/comments`)
      .set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`])
      .send({
        content: "Test Comment"
      });
    const newCommentId = createResponse.body._id;

    // Mock an error during comment deletion
    jest.spyOn(commentModel, 'findByIdAndDelete').mockImplementationOnce(() => {
      throw new Error("Error deleting comment");
    });

    const deleteResponse = await request(app)
      .delete(`/posts/${postId}/comments/${newCommentId}`)
      .set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`]);

    expect(deleteResponse.statusCode).toBe(500);
  });

  test("Test Delete Comment - By Owner", async () => {
    // Create a new comment
    const createResponse = await request(app)
      .post(`/posts/${postId}/comments`)
      .set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`])
      .send({
        content: "Test Comment"
      });
    const newCommentId = createResponse.body._id;

    const response = await request(app)
      .delete(`/posts/${postId}/comments/${newCommentId}`)
      .set('Cookie',[`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`]);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Comment deleted successfully");
  });

});