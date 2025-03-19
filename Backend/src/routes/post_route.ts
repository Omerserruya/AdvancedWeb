import express from "express";
const postsRoute = express.Router();
import postsController from "../controllers/post_controller";
import { authentification } from "../controllers/auth_controller";
import Comment from "../controllers/comment_controller";
import postUpload from '../middleware/multer'; // Import the updated multer middleware

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
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: accessToken
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
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
postsRoute.post('/', authentification, postUpload.single('image'), postsController.addPost);

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
 * /posts/liked:
 *   get:
 *     summary: Get all posts liked by the current user
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: A list of posts liked by the user
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Error retrieving liked posts
 */
postsRoute.get('/liked', authentification, postsController.getLikedPosts);

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
 *       - cookieAuth: []
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
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
postsRoute.put('/:id', authentification, postUpload.single('image'), postsController.updatePost);

/** 
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Delete a post by ID
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
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
 * /posts/{id}/image:
 *   post:
 *     summary: Update a post's image
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Post not found
 */
postsRoute.post('/:id/image', authentification, postUpload.single('image'), postsController.updatePostImage);

/**
 * @swagger
 * /posts/{id}/image:
 *   delete:
 *     summary: Remove a post's image
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The post ID
 *     responses:
 *       200:
 *         description: Image removed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Post or image not found
 */
postsRoute.delete('/:id/image', authentification, postsController.removePostImage);

/**
 * @swagger
 * /posts/{postID}/comments:
 *   post:
 *     summary: Create a new comment on a post
 *     tags: [Comments]
 *     security:
 *       - cookieAuth: []
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
 *       - cookieAuth: []
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
 *       - cookieAuth: []
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

/**
 * @swagger
 * /posts/{id}/like:
 *   post:
 *     summary: Like or unlike a post
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The post ID
 *     responses:
 *       200:
 *         description: Like status updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post or user not found
 */
postsRoute.post('/:id/like', authentification, postsController.toggleLike);

/**
 * @swagger
 * /posts/{id}/like:
 *   get:
 *     summary: Check if current user has liked a post
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The post ID
 *     responses:
 *       200:
 *         description: Like status retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */
postsRoute.get('/:id/like', authentification, postsController.checkLikeStatus);

/**
 * @swagger
 * /posts/{id}/metadata:
 *   patch:
 *     summary: Update post metadata (comments count, likes count)
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
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
 *             type: object
 *             properties:
 *               commentsCount:
 *                 type: integer
 *                 description: The number of comments on the post
 *               likesCount:
 *                 type: integer
 *                 description: The number of likes on the post
 *     responses:
 *       200:
 *         description: Post metadata updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 *       500:
 *         description: Error updating post metadata
 */
postsRoute.patch('/:id/metadata', authentification, postsController.updatePostMetadata);

export default postsRoute;