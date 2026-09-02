const { supabase } = require("../config/supabase");

/**
 * Middleware to require admin role
 * Must be used after protect middleware
 */
async function requireAdmin(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: "Admin access required" 
      });
    }

    next();
  } catch (err) {
    return res.status(403).json({ 
      success: false, 
      message: "Admin verification failed" 
    });
  }
}

/**
 * Middleware to check if user is admin OR owns the resource
 * @param {Function} getResourceUserId - Function that extracts user_id from resource
 */
function requireAdminOrOwner(getResourceUserId) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: "Authentication required" 
        });
      }

      // Admin bypass
      if (req.user.role === 'admin') {
        return next();
      }

      // Check ownership
      const resourceUserId = await getResourceUserId(req);
      if (resourceUserId === req.user.id) {
        return next();
      }

      return res.status(403).json({ 
        success: false, 
        message: "Access denied" 
      });
    } catch (err) {
      return res.status(403).json({ 
        success: false, 
        message: "Authorization check failed" 
      });
    }
  };
}

module.exports = { requireAdmin, requireAdminOrOwner };
