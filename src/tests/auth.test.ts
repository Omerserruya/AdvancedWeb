import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import postModel from "../models/post_model";
import { Express } from "express";
import userModel, { IUser } from "../models/user_model";
import jwt from 'jsonwebtoken';

var app: Express;

beforeAll(async () => {
  console.log("beforeAll");
  app = await initApp();
  await userModel.deleteMany();
  await postModel.deleteMany();
});

afterAll((done) => {
  console.log("afterAll");
  mongoose.connection.close();
  done();
});

const baseUrl = "/auth";

type User = IUser & {
  accessToken?: string,
  refreshToken?: string
};

const testUser = {
  email: "test@user.com",
  username: "testuser",
  password: "testpassword",
} as User;

describe("Auth Tests", () => {
  test("Auth test register", async () => {
    const response = await request(app).post(baseUrl + "/register").send(testUser);
    expect(response.statusCode).toBe(201);
  });

  test("Auth test register fail", async () => {
    const response = await request(app).post(baseUrl + "/register").send(testUser);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("User already exists");
  });

  test("Auth test register fail", async () => {
    const response = await request(app).post(baseUrl + "/register").send(testUser);
    expect(response.statusCode).not.toBe(200);
  });

  test("Auth test register fail", async () => {
    const response = await request(app).post(baseUrl + "/register").send({
      email: "sdsdfsd",
    });
    expect(response.statusCode).not.toBe(200);
    const response2 = await request(app).post(baseUrl + "/register").send({
      email: "",
      password: "sdfsd",
    });
    expect(response2.statusCode).not.toBe(200);
  });

  test("Auth test login", async () => {
    const response = await request(app).post(baseUrl + "/login").send(testUser);
    expect(response.statusCode).toBe(200);
    const accessToken = response.body.accessToken;
    const refreshToken = response.body.refreshToken;
    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();
    testUser.accessToken = accessToken;
    testUser.refreshToken = refreshToken;
    const user = await userModel.findOne({ email: testUser.email });
    testUser._id = user?._id;
  });

  test("Check tokens are not the same", async () => {
    const response = await request(app).post(baseUrl + "/login").send({"email":testUser.email, "password":testUser.password});
    const accessToken = response.body.accessToken;
    const refreshToken = response.body.refreshToken;
    expect(accessToken).not.toBe(testUser.accessToken);
    expect(refreshToken).not.toBe(testUser.refreshToken);
    testUser.accessToken = accessToken;
    testUser.refreshToken = refreshToken;
  });

  test("Auth test login fail", async () => {
    const response = await request(app).post(baseUrl + "/login").send({
      email: testUser.email,
      password: "sdfsd",
    });
    expect(response.statusCode).not.toBe(201);

    const response2 = await request(app).post(baseUrl + "/login").send({
      email: "dsfasd",
      password: "sdfsd",
    });
    expect(response2.statusCode).not.toBe(201);
  });

  test("Test refresh token", async () => {
    const response = await request(app).post(baseUrl + "/refresh").set({ authorization: testUser.accessToken + " " + testUser.refreshToken });
    expect(response.statusCode).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    testUser.accessToken = response.body.accessToken;
    testUser.refreshToken = response.body.refreshToken;
  });

  test("Double use refresh token", async () => {
    const response = await request(app).post(baseUrl + "/refresh").set({ authorization: testUser.accessToken + " " + testUser.refreshToken });
    expect(response.statusCode).toBe(200);
    const refreshTokenNew = response.body.refreshToken;

    const response2 = await request(app).post(baseUrl + "/refresh").set({ authorization: testUser.accessToken + " " + testUser.refreshToken });
    expect(response2.statusCode).not.toBe(200);

    const response3 = await request(app).post(baseUrl + "/refresh").set({ authorization: testUser.accessToken + " " + refreshTokenNew });
    expect(response3.statusCode).not.toBe(200);
  });

  test("Test logout", async () => {
    const response = await request(app).post(baseUrl + "/login").send(testUser);
    expect(response.statusCode).toBe(200);
    testUser.accessToken = response.body.accessToken;
    testUser.refreshToken = response.body.refreshToken;

    const response2 = await request(app).post(baseUrl + "/logout").set({ authorization: testUser.accessToken + " " + testUser.refreshToken });
    expect(response2.statusCode).toBe(200);

    const response3 = await request(app).post(baseUrl + "/refresh").set({ authorization: testUser.accessToken + " " + testUser.refreshToken });
    expect(response3.statusCode).not.toBe(200);

  });

  jest.setTimeout(10000);
  test("Test timeout token ", async () => {
    const response = await request(app).post(baseUrl + "/login").send(testUser);
    expect(response.statusCode).toBe(200);
    testUser.accessToken = response.body.accessToken;
    testUser.refreshToken = response.body.refreshToken;

    await new Promise((resolve) => setTimeout(resolve, 5000));

    const response2 = await request(app).post(baseUrl + "/test").set({ authorization: testUser.accessToken + " " + testUser.refreshToken });
    expect(response2.statusCode).not.toBe(200);

    const response3 = await request(app).post(baseUrl + "/refresh").set({ authorization: testUser.accessToken + " " + testUser.refreshToken });
    expect(response3.statusCode).toBe(200);
    testUser.accessToken = response3.body.accessToken;

    const response4 = await request(app).post(baseUrl + "/test").set({ authorization: testUser.accessToken + " " + testUser.refreshToken });
    expect(response4.statusCode).toBe(200);
  });

  test("Auth test login with invalid credentials", async () => {
    const response = await request(app).post(baseUrl + "/login").send({
      email: testUser.email,
      password: "wrongpassword",
    });
    expect(response.statusCode).toBe(401);
  });

  test("Auth test with expired access token", async () => {
    const response = await request(app).post(baseUrl + "/login").send(testUser);
    expect(response.statusCode).toBe(200);
    testUser.accessToken = response.body.accessToken;
    testUser.refreshToken = response.body.refreshToken;

    // Simulate token expiration
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const response2 = await request(app).post(baseUrl + "/test").set({ authorization: testUser.accessToken + " " + testUser.refreshToken });
    expect(response2.statusCode).toBe(401);
  });

  test("Auth test with invalid refresh token", async () => {
    const response = await request(app).post(baseUrl + "/refresh").set({ authorization: testUser.accessToken + " invalidRefreshToken" });
    expect(response.statusCode).toBe(401);
  });

  test("Auth test with missing tokens in refresh request", async () => {
    const response = await request(app).post(baseUrl + "/refresh").set({ authorization: "" });
    expect(response.statusCode).toBe(401);
  });
  
  test("Auth test login with non-existent email", async () => {
    const response = await request(app).post(baseUrl + "/login").send({
      email: "nonexistent@user.com",
      password: "testpassword",
    });
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Wrong email or password ");
  });

  test("Test refresh token - 500 error", async () => {
    // Mock the jwt.verify method to return a valid decoded token
    jest.spyOn(jwt, 'verify').mockImplementation((token, secret, callback) => {
      (callback as jwt.VerifyCallback)(null, { userId: new mongoose.Types.ObjectId() });
    });

    // Mock the userModel.findById method to throw an error
    jest.spyOn(userModel, 'findById').mockImplementationOnce(() => {
      throw new Error("Database error");
    });

    const response = await request(app).post(baseUrl + "/refresh").set({ authorization: "Bearer validRefreshToken" });
    expect(response.status).toBe(500);
    expect(response.body.error).toBeDefined();
  });
 
});