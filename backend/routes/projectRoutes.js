import express from 'express';
import { getAllProjects, createProject, updateProject, deleteProject } from '../controllers/projectController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, getAllProjects);
router.post('/', verifyToken, createProject);
router.patch('/:id', verifyToken, updateProject);
router.delete('/:id', verifyToken, deleteProject);

export default router;