import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import postModel from "../models/post_model";
import { Express } from "express";
import userModel, { IUser } from "../models/user_model";
import jwt from 'jsonwebtoken';
import createUserHelper from "../controllers/user_controller";

var app: Express;

beforeAll(async () => {
  app = await initApp();
  await userModel.deleteMany();
  await postModel.deleteMany();
});

afterAll((done) => {
  mongoose.connection.close();
  done();
});

const baseUrl = "/auth";

type User = IUser & {
  accessToken?: string,
  refreshToken?: string
};
const createUniqueUser = (suffix: string) => ({
  email: `test${suffix}@user.com`,
  username: `testuser${suffix}`,
  password: "testpassword",
} as User);

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
    
    expect(response.headers['set-cookie']).toBeDefined();
    const cookies = response.headers['set-cookie'] as unknown as string[];
    const accessTokenCookie = cookies.find((c: string) => c.includes('accessToken'));
    const refreshTokenCookie = cookies.find((c: string) => c.includes('refreshToken'));
    expect(accessTokenCookie).toBeDefined();
    expect(refreshTokenCookie).toBeDefined();
    
    testUser.accessToken = accessTokenCookie;
    testUser.refreshToken = refreshTokenCookie;
    const user = await userModel.findOne({ email: testUser.email });
    testUser._id = user?._id;
  });

  test("Check tokens are not the same", async () => {
    const response = await request(app).post(baseUrl + "/login").send({"email":testUser.email, "password":testUser.password});
    expect(response.statusCode).toBe(200);
    const cookies = response.headers['set-cookie'] as unknown as string[];
    const accessTokenCookie = cookies.find((c: string) => c.includes('accessToken'));
    const refreshTokenCookie = cookies.find((c: string) => c.includes('refreshToken'));
    expect(accessTokenCookie).toBeDefined();
    expect(refreshTokenCookie).toBeDefined();
    
    expect(accessTokenCookie).not.toBe(testUser.accessToken);
    expect(refreshTokenCookie).not.toBe(testUser.refreshToken);
    testUser.accessToken = accessTokenCookie;
    testUser.refreshToken = refreshTokenCookie;
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
    const response = await request(app)
      .post(baseUrl + "/refresh")
      .set('Cookie',`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`);
    
    expect(response.statusCode).toBe(200);
    const cookies = response.headers['set-cookie'] as unknown as string[];
    const accessTokenCookie = cookies.find((c: string) => c.includes('accessToken'));
    const refreshTokenCookie = cookies.find((c: string) => c.includes('refreshToken'));
    expect(accessTokenCookie).toBeDefined();
    expect(refreshTokenCookie).toBeDefined();
    
    testUser.accessToken = accessTokenCookie;
    testUser.refreshToken = refreshTokenCookie;
  });

  

  test("Double use refresh token", async () => {
    const response = await request(app)
      .post(baseUrl + "/refresh")
      .set('Cookie',`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`);
    
    expect(response.statusCode).toBe(200);
    const cookies = response.headers['set-cookie'] as unknown as string[];
    const refreshTokenNew = cookies.find((c: string) => c.includes('refreshToken'));
    expect(refreshTokenNew).toBeDefined();
    testUser.refreshToken = refreshTokenNew;

    const response2 = await request(app)
      .post(baseUrl + "/refresh")
      .set('Cookie',`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`);
    
    expect(response2.statusCode).not.toBe(200);

    const response3 = await request(app)
      .post(baseUrl + "/refresh")
      .set('Cookie',`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`);
    
    expect(response3.statusCode).not.toBe(200);
  });

  test("Test logout", async () => {
    const response = await request(app).post(baseUrl + "/login").send(testUser);
    expect(response.statusCode).toBe(200);
    const cookies = response.headers['set-cookie'] as unknown as string[];
    testUser.accessToken = cookies.find((c: string) => c.includes('accessToken'));
    testUser.refreshToken = cookies.find((c: string) => c.includes('refreshToken'));

    const response2 = await request(app)
      .post(baseUrl + "/logout")
      .set('Cookie',`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`);
    
    expect(response2.statusCode).toBe(200);

    const response3 = await request(app)
      .post(baseUrl + "/refresh")
      .set('Cookie',`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`);
    
    expect(response3.statusCode).not.toBe(200);
  });

  jest.setTimeout(10000);
test("Test timeout token", async () => {
    const response = await request(app).post(baseUrl + "/login").send(testUser);

    expect(response.statusCode).toBe(200);
    
    expect(response.headers['set-cookie']).toBeDefined();
    const cookies = response.headers['set-cookie'] as unknown as string[];
    const accessTokenCookie = cookies.find((c: string) => c.includes('accessToken'));
    const refreshTokenCookie = cookies.find((c: string) => c.includes('refreshToken'));
    expect(accessTokenCookie).toBeDefined();
    expect(refreshTokenCookie).toBeDefined();
    
    testUser.accessToken = accessTokenCookie;
    testUser.refreshToken = refreshTokenCookie;
    // Simulate token expiration
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Attempt to access a protected route with the expired token
    const response2 = await request(app).post(baseUrl + "/test").set('Cookie',`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`);
    expect(response2.statusCode).not.toBe(200);

    // Refresh the tokens
    const response3 = await request(app).post(baseUrl + "/refresh").set('Cookie',`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`);
    expect(response3.statusCode).toBe(200);
    expect(response.headers['set-cookie']).toBeDefined();
    const cookies1 = response.headers['set-cookie'] as unknown as string[];

    const accessTokenCookie1 = cookies1.find((c: string) => c.includes('accessToken'));
    const refreshTokenCookie1 = cookies1.find((c: string) => c.includes('refreshToken'));
    expect(accessTokenCookie1).toBeDefined();
    expect(refreshTokenCookie1).toBeDefined();
    testUser.accessToken = accessTokenCookie1;
    testUser.refreshToken = refreshTokenCookie1;
    // Attempt to access the protected route with the new tokens
    const response4 = await request(app).post(baseUrl + "/test").set('Cookie',`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`);
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

    const response2 = await request(app).post(baseUrl + "/test").set({ authorization: testUser.accessToken});
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

    const response = await request(app).post(baseUrl + "/refresh").set('Cookie',`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`);
    expect(response.status).toBe(500);
    expect(response.body.error).toBeDefined();
  });

  test("Auth test register - user already exists", async () => {
    jest.spyOn(createUserHelper, 'addUser').mockImplementationOnce(() => {
      throw new Error("User already exists");
    });

    const response = await request(app).post(baseUrl + "/register").send(testUser);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("User already exists");
  });

  test("Auth test register - generic error", async () => {
    jest.spyOn(createUserHelper, 'addUser').mockImplementationOnce(() => {
      throw new Error("Some other error");
    });

    const response = await request(app).post(baseUrl + "/register").send(testUser);
    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe("Error during registration");
    expect(response.body.error).toBe("Some other error");
  });

  test("Auth test login - catch block", async () => {
    jest.spyOn(userModel, 'findOne').mockImplementationOnce(() => {
      throw new Error("Database error");
    });

    const response = await request(app).post(baseUrl + "/login").send(testUser);
    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBeDefined();
  });


  test("Auth test - missing token", async () => {
    const response = await request(app).post(baseUrl + "/test").set({ authorization: "" });
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Auth failed: No authorization header");
  });

  test("Auth test - invalid token", async () => {
    jest.spyOn(jwt, 'verify').mockImplementationOnce(() => {
      throw new Error("Invalid token");
    });

    const response = await request(app).post(baseUrl + "/test").set({ authorization: testUser.accessToken + " invalidRefreshToken" });
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Auth failed");
  });

  test("Auth test logout - catch block", async () => {
    // Mock the jwt.verify method to return a valid decoded token
    jest.spyOn(jwt, 'verify').mockImplementation((token, secret, callback) => {
      (callback as jwt.VerifyCallback)(null, { userId: new mongoose.Types.ObjectId() });
    });
  
    // Mock the userModel.findById method to throw an error
    jest.spyOn(userModel, 'findById').mockImplementationOnce(() => {
      throw new Error("Database error");
    });
  
    const response = await request(app).post(baseUrl + "/logout").set('Cookie',`accessToken=${testUser.accessToken};refreshToken=${testUser.refreshToken}`);
    expect(response.status).toBe(500);
    expect(response.body.error).toBeDefined();
  });

  test("Auth test logout - missing refresh token", async () => {
    const uniqueTestUser = createUniqueUser("4");
    await request(app).post(baseUrl + "/register").send(uniqueTestUser);
    const loginResponse = await request(app).post(baseUrl + "/login").send(uniqueTestUser);
    expect(loginResponse.statusCode).toBe(200);
    uniqueTestUser.accessToken = loginResponse.body.accessToken;
    uniqueTestUser.refreshToken = loginResponse.body.refreshToken;

    const response = await request(app).post(baseUrl + "/logout").set({ authorization: uniqueTestUser.accessToken + " " });
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Auth failed:refresh token not included in headers");
  });

  test("Auth test logout - invalid refresh token", async () => {
    const uniqueTestUser = createUniqueUser("5");
    await request(app).post(baseUrl + "/register").send(uniqueTestUser);
    const loginResponse = await request(app).post(baseUrl + "/login").send(uniqueTestUser);
    expect(loginResponse.statusCode).toBe(200);
    uniqueTestUser.accessToken = loginResponse.body.accessToken;
    uniqueTestUser.refreshToken = loginResponse.body.refreshToken;
  
    // Mock the jwt.verify method to return an error
    jest.spyOn(jwt, 'verify').mockImplementation((token, secret, callback) => {
      (callback as jwt.VerifyCallback)(new jwt.JsonWebTokenError("Invalid token"), undefined);
    });
  
    const response = await request(app).post(baseUrl + "/logout").set({ authorization: uniqueTestUser.accessToken + " " + uniqueTestUser.refreshToken });
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Auth failed");
  });
  
  test("Auth test logout - user not found", async () => {
    const uniqueTestUser = createUniqueUser("6");

    // Register the test user
    await request(app).post(baseUrl + "/register").send(uniqueTestUser);

    // Login the test user and store tokens
    const loginResponse = await request(app).post(baseUrl + "/login").send(uniqueTestUser);
    expect(loginResponse.statusCode).toBe(200);
    uniqueTestUser.accessToken = loginResponse.body.accessToken;
    uniqueTestUser.refreshToken = loginResponse.body.refreshToken;



    // Mock jwt.verify to return a decoded token with a valid userId
    jest.spyOn(jwt, 'verify').mockImplementation((token, secret, callback) => {
      (callback as jwt.VerifyCallback)(null, { userId: new mongoose.Types.ObjectId() });
    });

    // Make the logout request
    const response = await request(app)
        .post(baseUrl + "/logout")
        .set({ authorization: uniqueTestUser.accessToken + " " + uniqueTestUser.refreshToken });



    // Assert the response status and message
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("invalid request");
});





test("Auth test logout - invalid refresh token in user tokens", async () => {
  // Create a unique test user object
  const uniqueTestUser = createUniqueUser("7");

  // Register the user
  await request(app).post(baseUrl + "/register").send(uniqueTestUser);

  // Login the user
  const loginResponse = await request(app).post(baseUrl + "/login").send(uniqueTestUser);
  expect(loginResponse.statusCode).toBe(200);
  uniqueTestUser.accessToken = loginResponse.body.accessToken;
  uniqueTestUser.refreshToken = loginResponse.body.refreshToken;

  // Find the user by email to get the userId
  const user = await userModel.findOne({ email: uniqueTestUser.email }).exec();
  const userId = user?._id;
  expect(userId).toBeDefined(); // Ensure the userId was found
  jest.spyOn(jwt, 'verify').mockImplementation((token, secret, callback) => {
    (callback as jwt.VerifyCallback)(null, { userId });
  });
  // Modify the user's tokens directly without mocking
  // Find the user and change their tokens array to simulate an invalid refresh token
  if (user) {
    user.tokens = ["someOtherRefreshToken"];
    await user.save();  // Change the tokens in the user object
  }
  // Make the logout request with the modified user tokens
  const response = await request(app)
    .post(baseUrl + "/logout")
    .set({ authorization: uniqueTestUser.accessToken + " " + uniqueTestUser.refreshToken });


  // Assertions
  expect(response.status).toBe(401);
  expect(response.body.message).toBe("invalid request: refresh token is wrong");
});

test("Refresh token - user not found", async () => {
  const uniqueTestUser = createUniqueUser("8");

    // Register the test user
    await request(app).post(baseUrl + "/register").send(uniqueTestUser);

    // Login the test user and store tokens
    const loginResponse = await request(app).post(baseUrl + "/login").send(uniqueTestUser);
    expect(loginResponse.statusCode).toBe(200);
    uniqueTestUser.accessToken = loginResponse.body.accessToken;
    uniqueTestUser.refreshToken = loginResponse.body.refreshToken;

  jest.spyOn(jwt, 'verify').mockImplementation((token, secret, callback) => {
      (callback as jwt.VerifyCallback)(null, { userId: new mongoose.Types.ObjectId() });
  });

  const response = await request(app).post(baseUrl + "/refresh").set({ authorization: uniqueTestUser.accessToken + " " + uniqueTestUser.refreshToken });
  expect(response.statusCode).toBe(401);
  expect(response.body.message).toBe("Invalid request: User not found");
});



});