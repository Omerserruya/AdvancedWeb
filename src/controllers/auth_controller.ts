import { Request, Response } from 'express';
import userModel from '../models/user_model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import addUser from "./user_controller";

// Create a new user
const register = async (req: Request, res: Response, next: any) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email });
        if (user) {
            res.status(400).json({ message: 'User already exists' });
        } else {

            res.status(201).json({ message: 'User created' });
        }
    } catch (error) {
        res.status(500).json({ error: error });
    }
}

// Login a user - return a token
const login = async (req: Request, res: Response, next: any) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            res.status(401).json({ message: 'Wrong email or password ' });
        } else {
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                const token = jwt.sign(
                    {
                        email: user.email,
                        userId: user._id,
                    },
                    process
                        .env
                        .JWT_KEY as string,
                    {
                        expiresIn: process.env.JWT_EXPIRES_IN,
                    }
                );
                const refreshToken = jwt.sign(
                    {
                        email: user.email,
                        userId: user._id,
                    },
                    process
                        .env
                        .JWT_REFRESH_KEY as string,
                    {
                        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
                    }
                );

                if (!user.tokens)  user.tokens = [refreshToken];
                else user.tokens.push(refreshToken);
                await user.save();
                res.status(200).json({ message: 'Auth successful', token: token , refreshToken: refreshToken});
            }
            else{
                res.status(401).json({ message: 'Auth failed' });
            }
        }
    } catch (error) {
        res.status(500).json({ error: error });
    }
}
// Logout a user - remove refreshToken from user
const logout = async (req: Request, res: Response, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        res.status(401).json({ message: 'Auth failed' });
    }
    jwt.verify(token as string, process.env.JWT_KEY as string, async (err: any, decoded: any) => {
        if (err) {
            res.status(401).json({ message: 'Auth failed' });
        }
        try {
            const user = await userModel.findOne({ email: decoded._id });
            if (!user) {
                res.status(401).json({ message: 'invalid request' });
            } 
            else if (!user.tokens.includes(token as string)) { 
                user.tokens = [];
                await user.save();
                res.status(401).json({ message: 'invalid request' });
            }
            else{
                user.tokens.splice(user.tokens.indexOf(token as string), 1);
                await user.save();
                res.status(200).json({ message: 'Logout successful' });
            }
           
        } catch (error) {
            res.status(500).json({ error: error });
        }
    }

    );

}

// Authentification middleware - check if token is valid
const authentification = async (req: Request, res: Response, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        res.status(401).json({ message: 'Auth failed' });
    }
    try {
        const decoded = jwt.verify(token as string, process.env.JWT_KEY as string, next());
    } catch (error) {
        res.status(401).json({ message: 'Auth failed' });
    }
}

// Refresh token - return a new token
const refreshToken = async (req: Request, res: Response, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        res.status(401).json({ message: 'Auth failed' });
    }   
    jwt.verify(token as string, process.env.JWT_REFRESH_KEY as string, async (err: any, decoded: any) => {
        if (err) {
            res.status(401).json({ message: 'Auth failed' });
        }
        try {
            const user = await userModel.findOne({ email: decoded._id });
            if (!user) {
                res.status(401).json({ message: 'invalid request' });
            } 
            else if (!user.tokens.includes(token as string)) { 
                user.tokens = [];
                await user.save();
                res.status(401).json({ message: 'invalid request' });
            }else{
            const newToken = jwt.sign(
                {
                    email: user.email,
                    userId: user._id,
                },
                process
                    .env
                    .JWT_KEY as string,
                {
                    expiresIn: process.env.JWT_EXPIRES_IN,
                }
            );
            const refreshToken = jwt.sign(
                {
                    email: user.email,
                    userId: user._id,
                },
                process
                    .env
                    .JWT_REFRESH_KEY as string,
                {
                    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
                }
            );
            user.tokens[user.tokens.indexOf(token as string)] = refreshToken;
            await user.save();
            res.status(200).json({ message: 'Auth successful', token: newToken ,refreshToken: refreshToken   });}
        } catch (error) {
            res.status(500).json({ error: error });
        }
    })
}

export default { login, register, logout, authentification, refreshToken};