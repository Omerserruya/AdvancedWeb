import { NextFunction, Request, Response } from 'express';
import userModel from '../models/user_model';
import jwt from 'jsonwebtoken';
import createUserHelper from "./user_controller";
import mongoose from 'mongoose';

const generateToken = (userId: string, email: string, secret: string, expiresIn: string) => {
    return jwt.sign(
        {
            email: email,
            userId: userId,
            random: Math.random().toString()
        },
        secret,
        {
            expiresIn: expiresIn,
        }
    );
}
// Function for user registration
const register = async (req: Request, res: Response)=> {
    const { username, email, password,role } = req.body;
      req.body.isRegister = true;
    // Validate required fields
    if (!username || !email || !password) {
        res.status(400).json({ message: "Username, email, and password are required" });
        return;
    }
   
    try {
        const user = await createUserHelper.addUser(req, res);
        res.status(201).send(user);
        return;
    } catch (error: any) {
        if (error.message === "User already exists") {
            res.status(400).json({ message: error.message });
            return;
        } else {
            res.status(500).json({ message: "Error during registration", error: error.message });
            return;
        }
    }
};

// Login a user - return a token
const login = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email:email }).select('+password');

        if (!user || !password || !email) {
            res.status(401).json({ message: 'Wrong email or password ' });
            return;
        } else {
            const match = await user.comparePassword(password);
            if (match) {
                const token = generateToken(user._id as string, user.email, process.env.JWT_KEY as string, process.env.JWT_EXPIRES_IN as string);
                const refreshToken = generateToken(user._id as string, user.email, process.env.JWT_REFRESH_KEY as string, process.env.JWT_REFRESH_EXPIRES_IN as string);
                user.tokens = [refreshToken];
                //if (!user.tokens) user.tokens = [refreshToken];
                //else user.tokens.push(refreshToken);
                await user.save();
                res.status(200).json({ message: 'Auth successful', accessToken: token, refreshToken: refreshToken });
                return;
            }
            else {
                res.status(401).json({ message: 'Auth failed' });
                return;
            }
        }
    } catch (er) {
        res.status(500).json({ error: er });
        return;
    }
}

// Logout a user - remove refreshToken from user
const logout = async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.headers.authorization?.split(" ")[1];

    if (!refreshToken) {
        res.status(401).json({ message: 'Auth failed:refresh token not included in headers' });  
        return;
    }
    jwt.verify(refreshToken as string, process.env.JWT_REFRESH_KEY as string, async (err: any, decoded: any) => {
        if (err) {
            res.status(401).json({ message: 'Auth failed' });
            return;
        }
        try {

            const user = await userModel.findById(decoded.userId).select('+tokens');
            if (!user) {
                res.status(401).json({ message: 'invalid request' });
                return;
            }

            else if (!user.tokens || !user.tokens.includes(refreshToken as string)) {

                user.tokens = [""];
                await user.save();
                res.status(401).json({ message: 'invalid request: refresh token is wrong' });
                return;
            }

            else {
                user.tokens.splice(user.tokens.indexOf(refreshToken as string), 1);
                await user.save();
                res.status(200).json({ message: 'Logout successful' });
                return;
            }

        } catch (error) {
            res.status(500).json({ error: error });
            return;
        }
    }
    );
}

type Payload = {
    userId: string;
    email: string;
};

// Authentification middleware - check if token is valid
export const authentification =  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[0];
    if (!token) {
        res.status(401).json({ message: 'Auth failed: No authorization header' });
        return;
    }
    try {
        jwt.verify(token, process.env.JWT_KEY as string, (err, payload) => {
            if (err) {
                res.status(401).send('Access Denied');
                return;
                
            }
            req.params.userId = (payload as Payload).userId;
            next();
        });
    } catch (error) {
        res.status(401).json({ message: 'Auth failed' });
        return;
    }
}

// Refresh token - return a new token
const refreshToken = async (req: Request, res: Response, next: any) => {
    const refreshToken = req.headers.authorization?.split(" ")[1];
    if (!refreshToken) {
         res.status(401).json({ message: 'Auth failed: No refresh token provided' });
         return;
    }
    jwt.verify(refreshToken as string, process.env.JWT_REFRESH_KEY as string, async (err: any, decoded: any) => {
        if (err) {
            return res.status(401).json({ message: 'Auth failed' });
        }
        try {
            const user = await userModel.findById( decoded.userId ).select('+tokens');
            if (!user) {
                return res.status(401).json({ message: 'Invalid request: User not found' });
            }
            else if (!user.tokens || !user.tokens.includes(refreshToken as string)) {           
                user.tokens = [""];
                await user.save();
                return res.status(401).json({ message: 'Invalid request: Refresh token not found' });
            } else {
                const newToken = generateToken(user._id as string, user.email, process.env.JWT_KEY as string, process.env.JWT_EXPIRES_IN as string);
                const newRefreshToken = generateToken(user._id as string, user.email, process.env.JWT_REFRESH_KEY as string, process.env.JWT_REFRESH_EXPIRES_IN as string);
                user.tokens[user.tokens.indexOf(refreshToken as string)] = newRefreshToken;
                await user.save();
                return res.status(200).json({ message: 'Auth successful', accessToken: newToken, refreshToken: newRefreshToken });
            }
        } catch (error) {
            res.status(500).json({ error: error });
        }
    })
}

const test = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Test successful' });
};
export default { login, register, logout, refreshToken , test};