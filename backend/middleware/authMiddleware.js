import jwt from 'jsonwebtoken';

// 1. Verify JWT Token
export const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1]; // Expecting "Bearer <token>"

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach the decoded payload (id, role) to the request object
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token.' });
    }
};

// 2. Role-Based Access Control (RBAC)
export const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
};