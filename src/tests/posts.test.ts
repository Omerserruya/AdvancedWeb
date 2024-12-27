import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import postModel from "../models/post_model";
import { Express } from "express";

var app: Express;

beforeAll(async () => {
  console.log("beforeAll");
  app = await initApp();
  await postModel.deleteMany();
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
    const response = await request(app).post("/posts").send({
      title: "Test Post",
      content: "Test Content",
      userID: "TestOwner",
    });
    expect(response.statusCode).toBe(201);
    expect(response.body.title).toBe("Test Post");
    expect(response.body.content).toBe("Test Content");
    expect(response.body.userID).toBe("TestOwner");
    postId = response.body._id;
  });

  test("Test get post by userID", async () => {
    const response = await request(app).get("/posts?userID=TestOwner");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].title).toBe("Test Post");
    expect(response.body[0].content).toBe("Test Content");
    expect(response.body[0].userID).toBe("TestOwner");
  });

  test("Test get post by id", async () => {
    const response = await request(app).get("/posts/" + postId);
    expect(response.statusCode).toBe(200);
    expect(response.body.title).toBe("Test Post");
    expect(response.body.content).toBe("Test Content");
    expect(response.body.userID).toBe("TestOwner");
  });

  test("Test Create Post 2", async () => {
    const response = await request(app).post("/posts").send({
      title: "Test Post 2",
      content: "Test Content 2",
      userID: "TestOwner2",
    });
    expect(response.statusCode).toBe(201);
  });

  test("Posts test get all 2", async () => {
    const response = await request(app).get("/posts");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(2);
  });

  test("Test update", async () => {
    const response = await request(app).put("/posts/" + postId).send({  
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
    const response = await request(app).delete("/posts/" + postId);
    expect(response.statusCode).toBe(200);
    const response2 = await request(app).get("/posts/" + postId);
    expect(response2.statusCode).toBe(404);
  });

  test("Test Create Post fail", async () => {
    const response = await request(app).post("/posts").send({
      title: "Test Post 2",
      content: "Test Content 2",
    });
    expect(response.statusCode).toBe(400);
  });
});
