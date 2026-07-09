// backend/controllers/projectController.js
import prisma from '../db.js';

export const getAllProjects = async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            select: { id: true, name: true }
        });
        res.status(200).json(projects);
    } catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
};

// Securely create a new project
export const createProject = async (req, res) => {
    try {
        const { name, description, userIds = [], teamIds = [] } = req.body;
        if (!name) return res.status(400).json({ error: 'Project name is required' });

        const newProject = await prisma.project.create({
            data: {
                name,
                description,
                users: { connect: userIds.map(id => ({ id: parseInt(id) })) },
                teams: { connect: teamIds.map(id => ({ id: parseInt(id) })) }
            },
            include: { users: true, teams: true }
        });
        res.status(201).json({ message: 'Project created successfully', project: newProject });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create project' });
    }
};

// Update an existing project
export const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, userIds = [], teamIds = [] } = req.body;

        const updatedProject = await prisma.project.update({
            where: { id: parseInt(id) },
            data: {
                name,
                description,
                users: { set: userIds.map(id => ({ id: parseInt(id) })) },
                teams: { set: teamIds.map(id => ({ id: parseInt(id) })) }
            },
            include: { users: true, teams: true }
        });
        res.status(200).json({ message: 'Project updated successfully', project: updatedProject });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update project' });
    }
};

// Safely delete a project
export const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;

        // SAFETY CHECK: Prevent deletion if reports are linked to this project
        const linkedReports = await prisma.report.count({
            where: { projectId: parseInt(id) }
        });

        if (linkedReports > 0) {
            return res.status(400).json({
                error: `Cannot delete project. There are ${linkedReports} reports attached to it.`
            });
        }

        await prisma.project.delete({
            where: { id: parseInt(id) }
        });

        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error("Error deleting project:", error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
};