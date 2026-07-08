// backend/controllers/userController.js
import bcrypt from 'bcryptjs'; // Using the Windows-friendly bcryptjs!
import prisma from '../db.js';

// Get all users for the manager to view
export const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                fullName: true,
                createdAt: true,
                role: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// Securely create a new user account
export const createUser = async (req, res) => {
    try {
        const { email, password, fullName, roleName = 'Team Member' } = req.body;

        // 1. Check if email is already taken
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // 2. Verify the role exists
        const role = await prisma.role.findUnique({ where: { name: roleName } });
        if (!role) {
            return res.status(400).json({ error: 'Invalid role specified' });
        }

        // 3. Hash the temporary password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 4. Save to database
        const newUser = await prisma.user.create({
            data: { email, passwordHash, fullName, roleId: role.id },
            select: { id: true, email: true, fullName: true, role: true } // Don't send password back!
        });

        res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: 'Failed to create user' });
    }
};