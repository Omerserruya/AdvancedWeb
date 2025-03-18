// Omer-Serruya-322570243-Ron-Elmalech-322766809
import dotenv from "dotenv"
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import mongoose from "mongoose";
import bodyParser from "body-parser";
import express, { Express } from "express";
import postsRoute from "./routes/post_route";
import healthRoute from "./routes/health_route";
import usersRoute from "./routes/user_route";
import authRoute from "./routes/auth_route";
import aiRoute from "./routes/ai_route";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import multer from 'multer';
import { upload } from './utils/imageHandler'; // We'll create this


const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Web Dev 2025 REST API",
      version: "1.0.0",
      description: "REST server including authentication using JWT",
    },
    servers: [{ url: "http://localhost:3000" }],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "authorization",
          description: "Enter your token here (without Bearer prefix)"
        }
      },
    }
  },
  apis: ["./src/routes/*.ts"],
};
const specs = swaggerJsDoc(options);


const app = express();
// "http://node21.cs.colman.ac.il"
const corsOptions = {
  origin:"http://localhost", // Adjust this to your frontend URL
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],

};

app.use(cors(corsOptions));

const jwtSecret = process.env.JWT_KEY;
if (!jwtSecret) {
  throw new Error("JWT_SECRET is not defined in the environment variables");
}

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const db = mongoose.connection
// db.on('error',error=>{console.log(error)})
// db.on('connected',()=>{console.log(`[ ${new Date().toISOString()} ] Connected Succefuly to MongoDB`)})

// Routes Use
app.use('/health',healthRoute)
app.use('/auth',authRoute)
app.use('/posts',postsRoute)
app.use('/users',usersRoute)
app.use('/ai',aiRoute)
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Error handling for file uploads


const mongoOptions = {
  user: process.env.MONGO_USER,          // MongoDB username
  pass: process.env.MONGO_PASSWORD,      // MongoDB password
  useNewUrlParser: true,     // Parse the URL using the new parser
  useUnifiedTopology: true  // Use the new topology engine (recommended)
};

const initApp = () => {
  return new Promise<Express>((resolve, reject) => {
    if (!process.env.MONGODB_URL) {
      reject("DB_CONNECT is not defined in .env file");
    } else {
      mongoose
      .connect(process.env.MONGODB_URL,mongoOptions)
      .then(() => {
        resolve(app);
      })
      .catch((error) => {
        console.error('MongoDB connection error:', error);
        reject(error);
      });
        }
  });
};

export default initApp;