import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
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
  role: "admin"
} as User;

const testUser = {
  email: "test@user.com",
  username: "testuser",
  password: "testpassword",
} as User;

beforeAll(async () => {
  console.log("beforeAll");
  app = await initApp();
  await userModel.deleteMany(); // Clear the users collection before running tests.
    
  // Register and login admin user
  const newadminUser = new userModel({
    username: adminUser.username, // Customize admin name if needed
    email: adminUser.email,
    password: adminUser.password,
    role: 'admin',
  });
  const adminRes = await request(app).post("/auth/login").send(newadminUser);
  adminUser.accessToken = adminRes.body.accessToken;
  adminUser.refreshToken = adminRes.body.refreshToken;

  // Register and login test user
  await request(app).post("/auth/register").send(testUser);
  const testRes = await request(app).post("/auth/login").send(testUser);
  testUser.accessToken = testRes.body.accessToken;
  testUser.refreshToken = testRes.body.refreshToken;
});

afterAll((done) => {
  console.log("afterAll");
  mongoose.connection.close();
  done();
});

let userId = ""; // Variable to store the ID of a created user.

describe("Users Tests", () => {
  test("Users test get all", async () => {
    const response = await request(app).get("/users");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(2); // Initially, there are two users (admin and test user).
  });

  test("Test get all users fail", async () => {
    // Simulate database failure by mocking userModel.find
    jest.spyOn(userModel, 'find').mockImplementationOnce(() => {
      throw new Error("Database error");
    });

    const response = await request(app).get("/users"); 
    expect(response.statusCode).toBe(404); // Should fail with a 404 error due to simulated DB failure
    expect(response.body.message).toBe("Error fetching users");
  });

  test("Test Create User", async () => {
    const response = await request(app).post("/users").set({authorization: adminUser.accessToken + " "  + adminUser.refreshToken }).send({
      username: "TestUser",
      email: "testuser@example.com",
      password: "TestPassword",
    });
    expect(response.statusCode).toBe(201);
    expect(response.body.username).toBe("TestUser");
    expect(response.body.email).toBe("testuser@example.com");
    userId = response.body._id; // Store the user's ID for later tests.
  });

  test("Test Create User fail - missing username, email, or password", async () => {
    const response = await request(app).post("/users").set({ authorization: adminUser.accessToken + " "  + adminUser.refreshToken  }).send({
      username: "TestUserFail",
      email: "testuserfail@example.com",
    });

    expect(response.statusCode).toBe(400); // Missing password
    expect(response.body.message).toBe("Username, email, and password are required");

    const response2 = await request(app).post("/users").set({ authorization: adminUser.accessToken + " "  + adminUser.refreshToken  }).send({
      username: "TestUserFail2",
      password: "password123",
    });
    expect(response2.statusCode).toBe(400); // Missing email
    expect(response2.body.message).toBe("Username, email, and password are required");

    const response3 = await request(app).post("/users").set({ authorization: adminUser.accessToken + " "  + adminUser.refreshToken  }).send({
      email: "testuserfail3@example.com",
      password: "password123",
    });
    expect(response3.statusCode).toBe(400); // Missing username
    expect(response3.body.message).toBe("Username, email, and password are required");
  });

  test("Test create user fail (Database error)", async () => {
    // Mock the save method to throw an error
    jest.spyOn(userModel.prototype, 'save').mockImplementationOnce(() => {
      throw new Error("Database error");
    });

    const response = await request(app).post("/users").set({ authorization: adminUser.accessToken + " "  + adminUser.refreshToken  }).send({
      username: "testuser3543",
      email: "testuser3545@example.com",
      password: "password123"
    });
    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe("Error creating user");
    expect(response.body.error).toBe("Database error");
  });

  test("Test get user by ID", async () => {
    const response = await request(app).get("/users/" + userId);
    expect(response.statusCode).toBe(200);
    expect(response.body.username).toBe("TestUser");
    expect(response.body.email).toBe("testuser@example.com");
  });

  test("Test get user by ID fail - user not found", async () => {
    const nonExistentId = new mongoose.Types.ObjectId(); // Valid but non-existent ID
    const response = await request(app).get("/users/" + nonExistentId);
    expect(response.statusCode).toBe(404); // Should return 404 for user not found
    expect(response.body.message).toBe("User not found"); // Ensure the correct error message
  });

  test('Invalid user ID format', async () => {
    const invalidId = '12345'; // Not a valid MongoDB ObjectId

    const response = await request(app).get(`/users/${invalidId}`);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Invalid user ID format");
  });

  test('Database error during user fetch', async () => {
    // Simulate an error in the database query
    const validId = new mongoose.Types.ObjectId();

    jest.spyOn(userModel, 'findById').mockImplementationOnce(() => {
      throw new Error("Database error");
    });

    const response = await request(app).get(`/users/${validId}`);

    expect(response.statusCode).toBe(404); // Even though it's a server-side error, it's caught and returned as a 404
    expect(response.body.message).toBe("Error fetching user");
    expect(response.body.error).toBe("Database error");
  });

  test("Test Update User", async () => {
    const response = await request(app).put("/users/" + userId).set({ authorization: adminUser.accessToken + " "  + adminUser.refreshToken  }).send({
      username: "UpdatedUser",
      email: "updateduser@example.com",
    });
    expect(response.statusCode).toBe(200);

    const afterResponse = await request(app).get("/users/" + userId).set({ authorization: adminUser.accessToken + " "  + adminUser.refreshToken  });
    expect(afterResponse.statusCode).toBe(200);
    expect(afterResponse.body.username).toBe("UpdatedUser");
    expect(afterResponse.body.email).toBe("updateduser@example.com");
  });

  test("Test Update User fail", async () => {
    const response = await request(app).put("/users/" + userId).set({ authorization: adminUser.accessToken + " "  + adminUser.refreshToken  }).send({});
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("At least one field (e.g., username, email) is required to update");
  });

  test("Test Update User with password", async () => {
    const newPassword = "newPassword123";
    const response = await request(app).put("/users/" + userId).set({ authorization: adminUser.accessToken + " "  + adminUser.refreshToken  }).send({
      username: "UpdatedUserWithPassword",
      email: "updateduserpassword@example.com",
      password: newPassword,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.username).toBe("UpdatedUserWithPassword");
    expect(response.body.email).toBe("updateduserpassword@example.com");
  });

  test("Test Update User fail - user not found", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app).put("/users/" + nonExistentId).set({ authorization: adminUser.accessToken + " "  + adminUser.refreshToken  }).send({
      username: "NewUsername",
    });
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("User not found");
  });

  test("Test Update User fail - database error", async () => {
    jest.spyOn(userModel, 'findByIdAndUpdate').mockImplementationOnce(() => {
      throw new Error("Database error");
    });

    const response = await request(app).put("/users/" + userId).set({ authorization: adminUser.accessToken + " "  + adminUser.refreshToken  }).send({
      username: "UpdatedUser",
    });
    expect(response.statusCode).toBe(500); // Database error
    expect(response.body.message).toBe("Error updating user");
  });

  test("Test Update User fail - update operation failed", async () => {
    jest.spyOn(userModel, 'findByIdAndUpdate').mockResolvedValueOnce(null); // Simulate update failure (no user updated)

    const response = await request(app).put("/users/" + userId).set({ authorization: adminUser.accessToken + " "  + adminUser.refreshToken  }).send({
      username: "FailedUpdate",
    });
    expect(response.statusCode).toBe(500); // Update failed
    expect(response.body.message).toBe("Failed to update user");
  });

  test("Test Delete User", async () => {
    const response = await request(app).delete("/users/" + userId).set({ authorization: adminUser.accessToken + " "  + adminUser.refreshToken  });
    expect(response.statusCode).toBe(200);

    const response2 = await request(app).get("/users/" + userId).set({ authorization: adminUser.accessToken + " "  + adminUser.refreshToken  });
    expect(response2.statusCode).toBe(404); // User should no longer exist.
  });

  test("Test Delete User fail - invalid ID format", async () => {
    const response = await request(app).delete("/users/invalidId").set({ authorization: adminUser.accessToken + " "  + adminUser.refreshToken  });
    expect(response.statusCode).toBe(404); // Invalid ID format should return 404
    expect(response.body.message).toBe("Invalid user ID format");
  });

  test("Test Delete User with valid ID but user not found", async () => {
    const nonExistentId = new mongoose.Types.ObjectId(); // Generate a valid but non-existent ObjectId
    const response = await request(app).delete("/users/" + nonExistentId).set({ authorization: adminUser.accessToken + " "  + adminUser.refreshToken  });
    expect(response.statusCode).toBe(404); // Should return 404 for user not found
    expect(response.body.message).toBe("User not found"); // Ensure the correct error message
  });

  test('Database error during user deletion', async () => {
    const validId = new mongoose.Types.ObjectId(); // Generate a valid ObjectId

    // Simulate a database error in findByIdAndDelete
    jest.spyOn(userModel, 'findByIdAndDelete').mockImplementationOnce(() => {
      throw new Error("Database error");
    });

    const response = await request(app).delete(`/users/${validId}`).set({ authorization: adminUser.accessToken + " "  + adminUser.refreshToken  });

    expect(response.statusCode).toBe(500); // Internal Server Error
    expect(response.body.message).toBe("Error deleting user");
    expect(response.body.error).toBe("Database error");
  });
  
  test("Test Update User fail - access denied", async () => {
    const response = await request(app).put("/users/" + userId).set({ authorization: testUser.accessToken + " " + testUser.refreshToken }).send({
      username: "UpdatedUser",
    });
    expect(response.statusCode).toBe(403);
    expect(response.body.message).toBe("Access denied");
  });

  test("Test Create User fail - access denied", async () => {
    const response = await request(app).post("/users").set({ authorization: testUser.accessToken + " " + testUser.refreshToken }).send({
      username: "NewUser",
      email: "newuser@example.com",
      password: "NewPassword",
    });
    expect(response.statusCode).toBe(403);
    expect(response.body.message).toBe("Access denied. Admin privileges required.");
  });

  test("Test Delete User fail - access denied", async () => {
    const response = await request(app).delete("/users/" + userId).set({ authorization: testUser.accessToken + " " + testUser.refreshToken });
    expect(response.statusCode).toBe(403);
    expect(response.body.message).toBe("Access denied");
  });
  test("Test Create User fail - invalid email format", async () => {
    const response = await request(app).post("/users").set({ authorization: adminUser.accessToken + " " + adminUser.refreshToken }).send({
      username: "InvalidEmailUser",
      email: "invalid-email-format",
      password: "password123",
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Invalid email format");
  });
});