import { NextFunction, Request, Response } from 'express';
import userModel, { IUser } from '../models/user_model';
import jwt, { Secret, SignOptions, JwtPayload } from 'jsonwebtoken';
import createUserHelper from "./user_controller";
import passport from 'passport';

interface TokenPayload {
    userId: string;
    email: string;
    nonce: string;
}

const generateToken = (
    userId: string, 
    email: string, 
    secret: Secret, 
    expiresIn: number | string
): string => {
    if (!secret) throw new Error('JWT secret is not defined');
    
    const payload: TokenPayload = {
        userId,
        email,
        nonce: Math.random().toString()
    };

    const signOptions: SignOptions = {
        expiresIn: expiresIn as jwt.SignOptions['expiresIn']
    };

    return jwt.sign(payload, secret, signOptions);
};

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
                const token = generateToken(user._id as string, user.email, process.env.JWT_KEY as Secret, process.env.JWT_EXPIRES_IN as string);
                const refreshToken = generateToken(user._id as string, user.email, process.env.JWT_REFRESH_KEY as Secret, process.env.JWT_REFRESH_EXPIRES_IN as string);
                
                if (!user.tokens) user.tokens = [refreshToken];
                else user.tokens.push(refreshToken);
                await user.save();

                res.cookie('accessToken', token, { httpOnly: true, secure: process.env.NODE_ENV === 'prod',sameSite:'none' });
                res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'prod' ,sameSite:'none'});
                
                // Return user data with the response
                res.status(200).json({
                    message: 'Auth successful',
                    user: {
                        _id: user._id,
                        username: user.username,
                        email: user.email,
                    }
                });
            }
            else {
                res.status(401).json({ message: 'Auth failed' });
                return;
            }
        }
    } catch (er) {
        res.status(500);
        return;
    }
};
// Login External users - after login with google or github for tokens
const loginExternal = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as IUser;
    try {
      // Check if the email exists but with different authentication method
      const existingUser = await userModel.findOne({ 
        email: user.email, 
        // Check if this is a different user (has different ID)
        _id: { $ne: user._id } 
      });

      if (existingUser) {
        // Email exists but belongs to a different user
        return res.redirect(`/auth/callback?error=email_exists`);
      }

      // Proceed with authentication as normal
      const token = generateToken(user._id as string, user.email, process.env.JWT_KEY as Secret, process.env.JWT_EXPIRES_IN as string);
      const refreshToken = generateToken(user._id as string, user.email, process.env.JWT_REFRESH_KEY as Secret, process.env.JWT_REFRESH_EXPIRES_IN as string);
      
      user.tokens = [refreshToken];
      await user.save();
      
      res.cookie('accessToken', token, { httpOnly: true, secure: process.env.NODE_ENV === 'prod', sameSite: 'none' });
      res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'prod', sameSite: 'none' });
      
      // Redirect to home page using relative path
      res.redirect(`/auth/callback?userId=${user._id}&username=${encodeURIComponent(user.username)}&email=${user.email}&role=${user.role}&createdAt=${user.createdAt}`);
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
                const newToken = generateToken(user._id as string, user.email, process.env.JWT_KEY as Secret, process.env.JWT_EXPIRES_IN as string);
                const newRefreshToken = generateToken(user._id as string, user.email, process.env.JWT_REFRESH_KEY as Secret, process.env.JWT_REFRESH_EXPIRES_IN as string);
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