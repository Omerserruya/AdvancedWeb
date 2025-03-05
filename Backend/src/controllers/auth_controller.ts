import { NextFunction, Request, Response } from 'express';
import userModel, { IUser } from '../models/user_model';
import jwt from 'jsonwebtoken';
import createUserHelper from "./user_controller";

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
                //user.tokens = [refreshToken];
                if (!user.tokens) user.tokens = [refreshToken];
                else user.tokens.push(refreshToken);
                await user.save();
                res.cookie('accessToken', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
                res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
                res.status(200).json({ message: 'Auth successful' }).redirect('/');
            }
            else {
                res.status(401).json({ message: 'Auth failed' });
                return;
            }
        }
    } catch (er) {
        res.status(500);
        res.status(500);
        return;
    }
};
// Login External users - after login with google or github for tokens
const loginExternal = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as IUser;
    try {
      const token = generateToken(user._id as string, user.email, process.env.JWT_KEY as string, process.env.JWT_EXPIRES_IN as string);
      const refreshToken = generateToken(user._id as string, user.email, process.env.JWT_REFRESH_KEY as string, process.env.JWT_REFRESH_EXPIRES_IN as string);
      //user.tokens = [refreshToken];
      if (!user.tokens) user.tokens = [refreshToken];
      else user.tokens.push(refreshToken);
      await user.save();
      res.cookie('accessToken', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' , sameSite: 'none'});
      res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' , sameSite: 'none'});
      res.status(200).json({ message: 'Auth successful' });
    } catch (error) {
      next(error);
    }
};
  

// Logout a user - remove refreshToken from user
const logout = async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;

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
                res.clearCookie('accessToken');
                res.clearCookie('refreshToken');
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
    const token = req.cookies.accessToken as string ; 
    if (!token) {
        res.status(401).json({ message: 'Auth failed: No credantials were given' });
        return;
    }
    try {
        jwt.verify(token, process.env.JWT_KEY as string, (err, payload) => {
            if (err) {
                res.status(401).json({ message: 'Auth failed' });
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
    const refreshToken = req.cookies.refreshToken as string;
    if (!refreshToken) {
         res.status(401).json({ message: 'Auth failed: No refresh token provided' });
         return;
    }
    jwt.verify(refreshToken as string, process.env.JWT_REFRESH_KEY as string, async (err: any, decoded: any) => {
        if (err) {
            console.log(err);
            return res.status(401).json({ message: 'Auth failed' });
        }
        try {
            const user = await userModel.findById( decoded.userId ).select('+tokens');
            if (!user) {
                console.log("2");
                return res.status(401).json({ message: 'Invalid request: User not found' });
            }
            else if (!user.tokens || !user.tokens.includes(refreshToken as string)) {           
                user.tokens = [""];
                await user.save();
                console.log("3");
                return res.status(401).json({ message: 'Invalid request: Refresh token not found' });
            } else {
                const newToken = generateToken(user._id as string, user.email, process.env.JWT_KEY as string, process.env.JWT_EXPIRES_IN as string);
                const newRefreshToken = generateToken(user._id as string, user.email, process.env.JWT_REFRESH_KEY as string, process.env.JWT_REFRESH_EXPIRES_IN as string);
                user.tokens[user.tokens.indexOf(refreshToken as string)] = newRefreshToken;
                await user.save();
                res.cookie('accessToken', newToken, { httpOnly: true, secure: process.env.NODE_ENV === 'prod' , sameSite: 'none'});
                res.cookie('refreshToken', newRefreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'prod' , sameSite: 'none'});
                return res.status(200).json({ message: 'Auth successful'});
            }
        } catch (error) {
            res.status(500).json({ error: error });
        }
    })
}

const test = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Test successful' });
};

const getCurrentUser = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId; // This should be set by your auth middleware
        const user = await userModel.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user data' });
    }
};

export default { 
    login, 
    register, 
    logout, 
    refreshToken, 
    test, 
    loginExternal,
    getCurrentUser 
};