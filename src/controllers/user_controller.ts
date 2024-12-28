import userModel from "../models/user_model";
import { Request, Response } from "express";
import mongoose from "mongoose";
// Function to add a new user
const addUser = async (req: Request, res: Response) => {
  const { username, email, password, role } = req.body;

  // Validate required fields
  if (!username || !email || !password) {
    res.status(400).json({ message: "Username, email, and password are required" });
    return;
  }

  try {
    const user = new userModel({ username, email, password, role });
    await user.save();
    res.status(201).json(user);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Error creating user", error: error.message });
  }
};

// Function to fetch all users
const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await userModel.find();
    res.status(200).json(users);
  } catch (error: any) {
    console.error(error);
    res.status(404).json({ message: "Error fetching users", error: error.message });
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
    console.error(error);
    res.status(404).json({ message: "Error fetching user", error: error.message });
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
    console.error(error);
   res.status(500).json({ message: "Error deleting user", error: error.message });
  }
};

// Function to update a user
const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { username, email, password, role }: { 
      username?: string; 
      email?: string; 
      password?: string; 
      role?: "user" | "admin"; 
    } = req.body;

    try {
      // Find the user by ID
      const user = await userModel.findById(id);
      if (!user) {
        res.status(404).json({ message: "User not found" });
      } else if (Object.keys(req.body).length === 0) {
        res.status(400).json({
          message: "At least one field (e.g., username, email) is required to update",
        });
      } else {
        // Prepare the update data using the body and preserve existing data if not provided
        const updatedUserData: Partial<{
          username: string;
          email: string;
          password: string;
          role: "user" | "admin";
        }> = {
          username: username || user.username,
          email: email || user.email,
          role: role || user.role,
        };

        // If password is provided in the request, include it in the update
        if (password) {
          updatedUserData.password = password;
        }

        // Update the user with the new data
        const updatedUser = await userModel.findByIdAndUpdate(id, updatedUserData, { new: true });

        // Handle case where update fails
        if (!updatedUser) {
          res.status(500).json({ message: "Failed to update user" });
          return;
        } else {
          // Respond with the updated user data
          res.status(200).json(updatedUser);
        }
      }
    } catch (error: any) {
      console.error(error);
      // Check if the error is a database-related issue
      if (error.message && error.message.includes("Database update failed")) {
        res.status(500).json({ message: "Failed to update user" });
      } else {
        // Handle other types of errors
        res.status(500).json({ message: "Error updating user", error: error.message });
      }
    }
  };

  
  
export default { addUser, getUsers, getUserById, updateUser, deleteUser };
