import express from "express";
const healthRoute = express.Router();
import { Request, Response } from "express";

/**
 * @swagger
 * tags:
 *   - name: Health
 *     description: Server health check endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     HealthResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           description: Status of the server
 *           example: UP
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Current server time
 *           example: "2023-07-01T12:00:00.000Z"
 *         message:
 *           type: string
 *           description: Health status message
 *           example: "Server is healthy"
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Get server health status
 *     tags: [Health]
 *     description: Returns the current health status of the server
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
healthRoute.get('/',async (req: Request, res: Response) => {
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      message: 'Server is healthy',
    });
  });

export default healthRoute;
  