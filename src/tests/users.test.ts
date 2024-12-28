import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import userModel from "../models/user_model";
import { Express } from "express";

var app: Express;

beforeAll(async () => {
  console.log("beforeAll");
  app = await initApp();
  await userModel.deleteMany(); // Clear the users collection before running tests.
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
    expect(response.body.length).toBe(0); // Initially, there are no users.
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
    const response = await request(app).post("/users").send({
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
    const response = await request(app).post("/users").send({
      username: "TestUserFail",
      email: "testuserfail@example.com",
    });
    expect(response.statusCode).toBe(400); // Missing password
    expect(response.body.message).toBe("Username, email, and password are required");
  
    const response2 = await request(app).post("/users").send({
      username: "TestUserFail2",
      password: "password123",
    });
    expect(response2.statusCode).toBe(400); // Missing email
    expect(response2.body.message).toBe("Username, email, and password are required");
  
    const response3 = await request(app).post("/users").send({
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
  
    const response = await request(app).post("/users")
      .send({ username: "testuser", email: "testuser@example.com", password: "password123" });
  
    // Verify that the response is a 500 error, as we mocked a server-side issue
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
    const response = await request(app).put("/users/" + userId).send({
      username: "UpdatedUser",
      email: "updateduser@example.com",
    });
    expect(response.statusCode).toBe(200);

    const afterResponse = await request(app).get("/users/" + userId);
    expect(afterResponse.statusCode).toBe(200);
    expect(afterResponse.body.username).toBe("UpdatedUser");
    expect(afterResponse.body.email).toBe("updateduser@example.com");
  });

  test("Test Update User", async () => {
    const response = await request(app).put("/users/" + userId).send({
      username: "UpdatedUser",  // Ensure this is included
      email: "updateduser@example.com",
    });
    expect(response.statusCode).toBe(200);
  
    const afterResponse = await request(app).get("/users/" + userId);
    expect(afterResponse.statusCode).toBe(200);
    expect(afterResponse.body.username).toBe("UpdatedUser");
    expect(afterResponse.body.email).toBe("updateduser@example.com");
  });
  

  // Test: Fail to update user due to empty body
  test("Test Update User fail", async () => {
    const response = await request(app).put("/users/" + userId).send({});
    expect(response.statusCode).toBe(400); 
    expect(response.body.message).toBe("At least one field (e.g., username, email) is required to update");
  });

  test("Test Update User with password", async () => {
    const newPassword = "newPassword123";
    const response = await request(app).put("/users/" + userId).send({
      username: "UpdatedUserWithPassword",
      email: "updateduserpassword@example.com",
      password: newPassword,
    });
  
    expect(response.statusCode).toBe(200);
    expect(response.body.username).toBe("UpdatedUserWithPassword");
    expect(response.body.email).toBe("updateduserpassword@example.com");
  });
  

  // Test: Fail when user not found
  test("Test Update User fail - user not found", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app).put("/users/" + nonExistentId).send({
      username: "NewUsername",
    });
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("User not found");
  });

  // Test: Fail when database update operation fails
  test("Test Update User fail - database error", async () => {
    jest.spyOn(userModel, 'findByIdAndUpdate').mockImplementationOnce(() => {
      throw new Error("Database error");
    });

    const response = await request(app).put("/users/" + userId).send({
      username: "UpdatedUser",
    });
    expect(response.statusCode).toBe(500); // Database error
    expect(response.body.message).toBe("Error updating user");
  });

  // Test: Fail when updated user is null
  test("Test Update User fail - update operation failed", async () => {
    jest.spyOn(userModel, 'findByIdAndUpdate').mockResolvedValueOnce(null); // Simulate update failure (no user updated)

    const response = await request(app).put("/users/" + userId).send({
      username: "FailedUpdate",
    });
    expect(response.statusCode).toBe(500); // Update failed
    expect(response.body.message).toBe("Failed to update user");
  });

  // Test: Database error during update (handling "Database update failed")
  test("Test Update User fail - database error during update", async () => {
    jest.spyOn(userModel, 'findByIdAndUpdate').mockImplementationOnce(() => {
      throw new Error("Database update failed");
    });

    const response = await request(app).put("/users/" + userId).send({
      username: "FailedUpdate",
    });
    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe("Failed to update user");
  });

  test("Test Delete User", async () => {
    const response = await request(app).delete("/users/" + userId);
    expect(response.statusCode).toBe(200);

    const response2 = await request(app).get("/users/" + userId);
    expect(response2.statusCode).toBe(404); // User should no longer exist.
  });

  test("Test Delete User fail - invalid ID format", async () => {
    const response = await request(app).delete("/users/invalidId");
    expect(response.statusCode).toBe(404); // Invalid ID format should return 404
    expect(response.body.message).toBe("Invalid user ID format");
  });

  test("Test Delete User with valid ID but user not found", async () => {
    // Use a valid but non-existent ID (e.g., a valid ObjectId but not in the database)
    const nonExistentId = new mongoose.Types.ObjectId(); // Generate a valid but non-existent ObjectId
    const response = await request(app).delete("/users/" + nonExistentId);
    expect(response.statusCode).toBe(404); // Should return 404 for user not found
    expect(response.body.message).toBe("User not found"); // Ensure the correct error message
  });

  test('Database error during user deletion', async () => {
    const validId = new mongoose.Types.ObjectId(); // Generate a valid ObjectId

    // Simulate a database error in findByIdAndDelete
    jest.spyOn(userModel, 'findByIdAndDelete').mockImplementationOnce(() => {
      throw new Error("Database error");
    });

    const response = await request(app).delete(`/users/${validId}`);

    expect(response.statusCode).toBe(500); // Internal Server Error
    expect(response.body.message).toBe("Error deleting user");
    expect(response.body.error).toBe("Database error");
  });

});
