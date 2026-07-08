// backend/routes/userRoutes.js
import express from 'express';
import { getAllUsers, createUser } from '../controllers/userController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Both routes require the manager to be logged in
router.get('/', verifyToken, getAllUsers);
router.post('/', verifyToken, createUser);

export default router;