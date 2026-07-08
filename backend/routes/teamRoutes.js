// backend/routes/teamRoutes.js
import express from 'express';
import { getAllTeams, createTeam, updateTeam, deleteTeam } from '../controllers/teamController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, getAllTeams);
router.post('/', verifyToken, createTeam);
router.patch('/:id', verifyToken, updateTeam);
router.delete('/:id', verifyToken, deleteTeam);

export default router;