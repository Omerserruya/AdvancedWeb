import userModel from "../models/user_model";
import { Request, Response } from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";


// Helper function to create a new user
const createUserHelper = async (username: string, email: string, password: string, role?: string) => {
  const existingEmail = await userModel.findOne({ email });
  const existingUsername = await userModel.findOne({ username });
  
  if (existingEmail || existingUsername) {
    throw new Error("User already exists");
  }
  
  const encryptedPassword = await bcrypt.hash(password, 10);
  const lowerEmail = email.toLowerCase();
  
  const user = new userModel({
    username,
    email: lowerEmail,
    password: encryptedPassword,
    role,
  });
  
  await user.save();
  return user;
};

// Function to add a new user (admin function or similar)
const addUser = async (req: Request, res: Response) => {
  const { username, email, password, role } = req.body;

  // Validate required fields
  if (!username || !email || !password) {
    res.status(400).json({ message: "Username, email, and password are required" });
    return;
  }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ message: "Invalid email" });
    return;
  }
  try {
    const user = await createUserHelper(username, email, password, role);
    res.status(201).json(user);
  } catch (error: any) {
    if (error.message === "User already exists") {
      res.status(400).json({ message: error.message });
      return;
    } else {
      res.status(500).json({ message: "Error creating user", error: error.message });
      return;
    }
  }
};

// Function to fetch all users
const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await userModel.find();
    res.status(200).json(users);
    return;
  } catch (error: any) {
    res.status(404).json({ message: "Error fetching users", error: error.message });
    return;
  }
};

// Function to fetch a user by ID
const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: "Invalid user ID format" });
        return;
    }
    const user = await userModel.findById(id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json(user);
  } catch (error: any) {
    res.status(404).json({ message: "Error fetching user", error: error.message });
    return;
  }
};

// Function to delete a user
const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
         res.status(404).json({ message: "Invalid user ID format" });
         return;
      }
    const deletedUser = await userModel.findByIdAndDelete(id);
    if (!deletedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).send(); // No content
  } catch (error: any) {
   res.status(500).json({ message: "Error deleting user", error: error.message });
  }
};

// Function to update a user
const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { username, email, password }: { 
      username?: string; 
      email?: string; 
      password?: string; 
    } = req.body;

    try {
      // Find the user by ID
      const user = await userModel.findById(id);

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      } else if (Object.keys(req.body).length === 0) {
        res.status(400).json({
          message: "At least one field (e.g., username, email) is required to update",
        });
        return;
      } else {


        // If password is provided in the request, include it in the update
        let encryptedPassword = user.password;
        if (password) {
          encryptedPassword = await bcrypt.hash(password, 10);
        }


        // Update the user with the new data
        const updatedUser = await userModel.findByIdAndUpdate(id, {
          username: username || user.username,
          email: email || user.email,
          password: encryptedPassword,
        }, { new: true });

        // Handle case where update fails
        if (!updatedUser) {
          res.status(500).json({ message: "Failed to update user" });
          return;
        } else {
          // Respond with the updated user data
          res.status(200).json(updatedUser);
          return;
        }
      }
    } catch (error: any) {
      // Check if the error is a database-related issue
      if (error.message && error.message.includes("Database update failed")) {
        res.status(500).json({ message: "Failed to update user" });
        return;
      } else {
        // Handle other types of errors
        res.status(500).json({ message: "Error updating user", error: error.message });
        return
      }
    }
  };

  
  
export default { addUser, getUsers, getUserById, updateUser, deleteUser, createUserHelper };
