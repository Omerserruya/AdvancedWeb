// Omer-Serruya-322570243-Ron-Elmalech-322766809
import dotenv from "dotenv"
dotenv.config();
import mongoose from "mongoose";
import bodyParser from "body-parser";
import express, { Express } from "express";
import postsRoute from "./routes/post_route";
import healthRoute from "./routes/health_route";

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const db = mongoose.connection
db.on('error',error=>{console.log(error)})
db.on('connected',()=>{console.log(`[ ${new Date().toISOString()} ] Connected Succefuly to MongoDB`)})

// Routes Use
app.use('/health',healthRoute)
app.use('/posts',postsRoute)

const initApp = () => {
  return new Promise<Express>((resolve, reject) => {
    if (!process.env.MONGODB_URL) {
      reject("DB_CONNECT is not defined in .env file");
    } else {
      mongoose
        .connect(process.env.MONGODB_URL)
        .then(() => {
          resolve(app);
        })
        .catch((error) => {
          reject(error);
        });
    }
  });
};

export default initApp;