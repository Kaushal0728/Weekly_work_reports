import express from 'express';
import { askAssistant } from '../controllers/chatController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', verifyToken, askAssistant);

export default router;