// backend/routes/projectRoutes.js
import express from 'express';
import { getAllProjects } from '../controllers/projectController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect this route so only logged-in users can see the project list
router.get('/', verifyToken, getAllProjects);

export default router;