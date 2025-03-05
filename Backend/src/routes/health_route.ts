import express from "express";
const healthRoute = express.Router();
import { Request, Response } from "express";


healthRoute.get('/',async (req: Request, res: Response) => {
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      message: 'Server is healthy',
    });
  });

export default healthRoute;
  