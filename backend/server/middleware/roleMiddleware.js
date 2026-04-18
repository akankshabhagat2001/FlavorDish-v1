const normalizeRole = (role) => {
    if (role === 'restaurant') return 'restaurant_owner';
    if (role === 'delivery') return 'delivery_partner';
    return role;
};

/**
 * Authorize users based on their roles
 */
export const authorizeRoles = (...roles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized. Please login first.' });
    }

    // Never trust role from frontend payload, always use req.user (resolved by DB/JWT)
    const userRole = normalizeRole(req.user.role);
    const allowedRoles = roles.map(normalizeRole);

    if (roles.length > 0 && !allowedRoles.includes(userRole)) {
        return res.status(403).json({ message: 'Forbidden. Insufficient permissions.' });
    }

    next();
};

/**
 * Middleware to protect admin-only routes
 */
export const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied: Admins only' });
    }
    next();
};
