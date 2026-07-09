// backend/controllers/teamController.js
import prisma from '../db.js';

export const getAllTeams = async (req, res) => {
    try {
        const teams = await prisma.team.findMany({
            include: { members: { select: { id: true, fullName: true, email: true } } }
        });
        res.status(200).json(teams);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
};

export const createTeam = async (req, res) => {
    try {
        const { name, description, memberIds = [] } = req.body;

        // Safely build the data object
        const teamData = { name, description };
        if (memberIds.length > 0) {
            teamData.members = { connect: memberIds.map(id => ({ id: parseInt(id) })) };
        }

        const newTeam = await prisma.team.create({
            data: teamData,
            include: { members: { select: { id: true, fullName: true } } }
        });
        res.status(201).json({ message: 'Team created', team: newTeam });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create team' });
    }
};

export const updateTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, memberIds = [] } = req.body;

        const teamData = { name, description };
        if (memberIds.length > 0) {
            teamData.members = { set: memberIds.map(userId => ({ id: parseInt(userId) })) };
        } else {
            teamData.members = { set: [] };
        }

        const updatedTeam = await prisma.team.update({
            where: { id: parseInt(id) },
            data: teamData,
            include: { members: { select: { id: true, fullName: true } } }
        });
        res.status(200).json({ message: 'Team updated', team: updatedTeam });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update team' });
    }
};

export const deleteTeam = async (req, res) => {
    try {
        await prisma.team.delete({ where: { id: parseInt(req.params.id) } });
        res.status(200).json({ message: 'Team deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete team' });
    }
};