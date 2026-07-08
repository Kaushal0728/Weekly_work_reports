// backend/controllers/reportsController.js
import prisma from '../db.js';

export const submitReport = async (req, res) => {
    try {
        // The user ID comes securely from the JWT, NOT from the frontend body!
        const userId = req.user.id;

        const {
            projectId,
            weekStartDate,
            weekEndDate,
            tasksCompleted,
            tasksPlanned,
            blockers,
            hoursWorked
        } = req.body;

        // Save it to the database
        const report = await prisma.report.create({
            data: {
                userId,
                projectId: Number(projectId), // Ensure it's treated as a number
                weekStartDate: new Date(weekStartDate),
                weekEndDate: new Date(weekEndDate),
                tasksCompleted,
                tasksPlanned,
                blockers,
                hoursWorked: hoursWorked ? parseFloat(hoursWorked) : null,
                status: 'submitted',
            }
        });

        res.status(201).json({ message: 'Report submitted successfully', report });
    } catch (error) {
        console.error("Error submitting report:", error);
        res.status(500).json({ error: error.message || 'Failed to submit report' });
    }

};

export const getAllReports = async (req, res) => {
    try {
        const reports = await prisma.report.findMany({
            include: {
                project: { select: { id: true, name: true } },
                // Tell Prisma to fetch the user AND their associated teams!
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        teams: { select: { id: true, name: true } }
                    }
                }
            },
            orderBy: { weekStartDate: 'desc' } // Good practice to order them by date
        });
        res.status(200).json(reports);
    } catch (error) {
        console.error("Error fetching reports:", error);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
};

export const updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate the incoming status value
        const validStatuses = ['approved', 'rejected', 'submitted', 'pending'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        // Update the report status in the database
        const updatedReport = await prisma.report.update({
            where: { id: parseInt(id) },
            data: { status }
        });

        res.status(200).json({ message: `Report status updated to ${status}`, report: updatedReport });
    } catch (error) {
        console.error("Error updating report status:", error);
        res.status(500).json({ error: 'Failed to update report status' });
    }
};

export const getMyReports = async (req, res) => {
    try {
        // req.user.id is securely extracted from the JWT token
        const userId = req.user.id;

        const reports = await prisma.report.findMany({
            where: { userId },
            orderBy: { id: 'desc' }, // Newest first
            include: {
                project: {
                    select: { name: true }
                }
            }
        });

        res.status(200).json(reports);
    } catch (error) {
        console.error("Error fetching user reports:", error);
        res.status(500).json({ error: 'Failed to fetch your reports' });
    }
};

export const updateMyReport = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { tasksCompleted, tasksPlanned, blockers, hoursWorked } = req.body;

        // 1. Find the report and ensure it belongs to this user
        const existingReport = await prisma.report.findUnique({ where: { id: parseInt(id) } });

        if (!existingReport) {
            return res.status(404).json({ error: 'Report not found' });
        }
        if (existingReport.userId !== userId) {
            return res.status(403).json({ error: 'You can only edit your own reports' });
        }
        if (existingReport.status === 'approved') {
            return res.status(400).json({ error: 'Cannot edit a report that has already been approved' });
        }

        // 2. Update the report
        const updatedReport = await prisma.report.update({
            where: { id: parseInt(id) },
            data: {
                tasksCompleted,
                tasksPlanned,
                blockers,
                hoursWorked: hoursWorked ? parseFloat(hoursWorked) : null,
                // Reset status back to submitted in case it was 'rejected' and they are fixing it
                status: 'submitted'
            }
        });

        res.status(200).json({ message: 'Report updated successfully', report: updatedReport });
    } catch (error) {
        console.error("Error updating report:", error);
        res.status(500).json({ error: 'Failed to update report' });
    }
};