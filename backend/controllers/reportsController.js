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
            hoursWorked,
            notes
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
                hoursWorked,
                notes,
                status: 'submitted',
                submittedAt: new Date(),
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
        // Only fetch reports, but attach the user's name and project name to each one
        const reports = await prisma.report.findMany({
            orderBy: { createdAt: 'desc' }, // Newest reports first
            include: {
                user: {
                    select: { fullName: true, email: true }
                },
                project: {
                    select: { name: true }
                }
            }
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
            orderBy: { createdAt: 'desc' }, // Newest first
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