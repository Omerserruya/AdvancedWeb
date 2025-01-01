import express from "express";
const usersRoute = express.Router();
import userController from "../controllers/user_controller";

usersRoute.post('/', userController.addUser);
usersRoute.get('/', userController.getUsers);
usersRoute.get('/:id', userController.getUserById);
usersRoute.put('/:id', userController.updateUser);
usersRoute.delete('/:id', userController.deleteUser);

 
export default usersRoute;
  