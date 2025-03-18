import express from "express";
const postsRoute = express.Router();
import postsController from "../controllers/post_controller";
import { authentification } from "../controllers/auth_controller";
import Comment from "../controllers/comment_controller";
import upload from '../middleware/multer'; // Import the multer middleware

/**
 * @swagger
 * tags:
 *   - name: Posts
 *     description: The Posts API
 *   - name: Comments
 *     description: The Comments API
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     ApiKeyAuth:
 *       type: apiKey
 *       in: header
 *       name: authorization
 *   schemas:
 *     Post:
 *       type: object
 *       required:
 *         - title
 *         - content
 *       properties:
 *         title:
 *           type: string
 *           description: The post title
 *         content:
 *           type: string
 *           description: The post content
 *       example:
 *         title: 'My Post'
 *         content: 'This is the content of the post'
 *     Comment:
 *       type: object
 *       required:
 *         - content
 *       properties:
 *         content:
 *           type: string
 *           description: The comment content
 *       example:
 *         content: 'This is a comment'
 */

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Post'
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
postsRoute.post('/', upload.array('images'), authentification, postsController.addPost);

/** 
 * @swagger
 * /posts:
 *   get:
 *     summary: Get all posts
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: A list of posts
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Error retrieving posts
 */
postsRoute.get('/', postsController.getPost);

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: Get a post by ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The post ID
 *     responses:
 *       200:
 *         description: The post data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 *       500:
 *         description: Error retrieving post
 */
postsRoute.get('/:id', postsController.getPostById);

/** 
 * @swagger
 * /posts/{id}:
 *   put:
 *     summary: Update a post by ID
 *     tags: [Posts]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Post'
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Post not found
 */
postsRoute.put('/:id', authentification, postsController.updatePost);

/** 
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Delete a post by ID
 *     tags: [Posts]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The post ID
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Post not found
 */
postsRoute.delete('/:id', authentification, postsController.deletePost);

/**
 * @swagger
 * /posts/{postID}/comments:
 *   post:
 *     summary: Create a new comment on a post
 *     tags: [Comments]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: postID
 *         schema:
 *           type: string
 *         required: true
 *         description: The post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 *       500:
 *         description: Error creating comment
 */
postsRoute.post('/:postID/comments', authentification, Comment.createComment);

/**
 * @swagger
 * /posts/{postID}/comments:
 *   get:
 *     summary: Get all comments on a post
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postID
 *         schema:
 *           type: string
 *         required: true
 *         description: The post ID
 *     responses:
 *       200:
 *         description: A list of comments
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 *       500:
 *         description: Error retrieving comments
 */
postsRoute.get('/:postID/comments', Comment.getComments);

/**
 * @swagger
 * /posts/{postID}/comments/{commentID}:
 *   get:
 *     summary: Get a comment by ID
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postID
 *         schema:
 *           type: string
 *         required: true
 *         description: The post ID
 *       - in: path
 *         name: commentID
 *         schema:
 *           type: string
 *         required: true
 *         description: The comment ID
 *     responses:
 *       200:
 *         description: The comment data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Error retrieving comment
 */
postsRoute.get('/:postID/comments/:commentID', Comment.getComments);

/** 
 * @swagger   
 * /posts/{postID}/comments/{commentID}:
 *   put:
 *     summary: Update a comment by ID
 *     tags: [Comments]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: postID
 *         schema:
 *           type: string
 *         required: true
 *         description: The post ID
 *       - in: path
 *         name: commentID
 *         schema:
 *           type: string
 *         required: true
 *         description: The comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Error updating comment
 */
postsRoute.put('/:postID/comments/:commentID', authentification, Comment.updateComment);

/** 
 * @swagger
 * /posts/{postID}/comments/{commentID}:
 *   delete:
 *     summary: Delete a comment by ID
 *     tags: [Comments]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: postID
 *         schema:
 *           type: string
 *         required: true
 *         description: The post ID
 *       - in: path
 *         name: commentID
 *         schema:
 *           type: string
 *         required: true
 *         description: The comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Error deleting comment
 */
postsRoute.delete('/:postID/comments/:commentID', authentification, Comment.deleteComment);

export default postsRoute;