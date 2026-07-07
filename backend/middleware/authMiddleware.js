// backend/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    // 1. Grab the token from the request headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // 2. Verify the token using your secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Attach the decoded user data to the request so the controller can use it
        req.user = decoded;

        // 4. Move on to the controller
        next();
    } catch (error) {
        res.status(403).json({ error: 'Invalid or expired token.' });
    }
};