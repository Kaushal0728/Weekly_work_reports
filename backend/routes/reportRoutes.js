// backend/routes/reportRoutes.js
import express from 'express';
import { submitReport, getAllReports } from '../controllers/reportsController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Notice how we inject the verifyToken middleware right before the controller
router.post('/', verifyToken, submitReport);
router.get('/', verifyToken, getAllReports);

export default router;