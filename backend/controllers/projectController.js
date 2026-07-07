// backend/controllers/projectController.js
import prisma from '../db.js';

export const getAllProjects = async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            select: { id: true, name: true } // We only need the ID and name for the dropdown
        });
        res.status(200).json(projects);
    } catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
};