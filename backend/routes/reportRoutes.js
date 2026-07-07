import express from 'express';
import { submitReport, getAllReports, updateReportStatus, getMyReports } from '../controllers/reportsController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', verifyToken, submitReport);
router.get('/', verifyToken, getAllReports);
router.get('/me', verifyToken, getMyReports);
router.patch('/:id/status', verifyToken, updateReportStatus);

export default router;