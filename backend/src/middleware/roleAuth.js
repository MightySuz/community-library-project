/**
 * Role-based authentication middleware
 * Ensures that the authenticated user has one of the required roles
 */

const roleAuth = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated (should be set by auth middleware)
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Please authenticate to access this resource'
        });
      }

      // Check if user has one of the allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
          userRole: req.user.role
        });
      }

      // User has required role, proceed
      next();
    } catch (error) {
      console.error('Role auth middleware error:', error);
      res.status(500).json({
        error: 'Authorization check failed',
        message: 'Internal server error during role verification'
      });
    }
  };
};

module.exports = roleAuth;
