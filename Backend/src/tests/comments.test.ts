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
  testUser.accessToken = testRes.body.accessToken;
  testUser.refreshToken = testRes.body.refreshToken;

  // Create a test post
  const postResponse = await request(app)
    .post("/posts")
    .set({ authorization: testUser.accessToken + " " + testUser.refreshToken })
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
      .set({ authorization: testUser.accessToken + " " + testUser.refreshToken })
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
      .set({ authorization: testUser.accessToken + " " + testUser.refreshToken })
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
      .set({ authorization: testUser.accessToken + " " + testUser.refreshToken })
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
      .set({ authorization: testUser.accessToken + " " + testUser.refreshToken })
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
      .set({ authorization: testUser.accessToken + " " + testUser.refreshToken })
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
      .set({ authorization: testUser.accessToken + " " + testUser.refreshToken })
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
    otherUser.accessToken = otherUserRes.body.accessToken;
    otherUser.refreshToken = otherUserRes.body.refreshToken;

    const response = await request(app)
      .put(`/posts/${postId}/comments/${commentId}`)
      .set({ authorization: otherUser.accessToken + " " + otherUser.refreshToken })
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
      .set({ authorization: testUser.accessToken + " " + testUser.refreshToken });

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe('Comment not found');
  });

  

  test("Test Delete Comment - Access Denied", async () => {
    // Create a new comment with testUser
    const createResponse = await request(app)
      .post(`/posts/${postId}/comments`)
      .set({ authorization: testUser.accessToken + " " + testUser.refreshToken })
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
    otherUser.accessToken = otherUserRes.body.accessToken;
    otherUser.refreshToken = otherUserRes.body.refreshToken;

    // Attempt to delete the comment with a different user
    const deleteResponse = await request(app)
      .delete(`/posts/${postId}/comments/${newCommentId}`)
      .set({ authorization: otherUser.accessToken + " " + otherUser.refreshToken });

    expect(deleteResponse.statusCode).toBe(403);
    expect(deleteResponse.body.message).toBe('Access denied');
  });

  test("Test Delete Comment - Error", async () => {
    // Create a new comment
    const createResponse = await request(app)
      .post(`/posts/${postId}/comments`)
      .set({ authorization: testUser.accessToken + " " + testUser.refreshToken })
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
      .set({ authorization: testUser.accessToken + " " + testUser.refreshToken });

    expect(deleteResponse.statusCode).toBe(500);
  });

  test("Test Delete Comment - By Owner", async () => {
    // Create a new comment
    const createResponse = await request(app)
      .post(`/posts/${postId}/comments`)
      .set({ authorization: testUser.accessToken + " " + testUser.refreshToken })
      .send({
        content: "Test Comment"
      });
    const newCommentId = createResponse.body._id;

    const response = await request(app)
      .delete(`/posts/${postId}/comments/${newCommentId}`)
      .set({ authorization: testUser.accessToken + " " + testUser.refreshToken });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Comment deleted successfully");
  });

});