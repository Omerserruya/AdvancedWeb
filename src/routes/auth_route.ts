import express from "express";
const authRoute = express.Router();
import auth from "../controllers/auth_controller";

authRoute.post('/register', auth.register);
authRoute.post('/login', auth.login);
authRoute.post('/logout', auth.logout);
 
export default authRoute;
  