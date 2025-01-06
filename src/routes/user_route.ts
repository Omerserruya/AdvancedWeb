import express from "express";
const usersRoute = express.Router();
import userController from "../controllers/user_controller";
import { authentification } from "../controllers/auth_controller";

usersRoute.post('/', authentification , userController.addUser);
usersRoute.get('/', userController.getUsers);
usersRoute.get('/:id', userController.getUserById); 
usersRoute.put('/:id', authentification , userController.updateUser);
usersRoute.delete('/:id', authentification , userController.deleteUser);

 
export default usersRoute;
  