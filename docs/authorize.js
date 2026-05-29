/**
 * Middleware to restrict access based on user roles
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'satgas', 'user')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Akses Ditolak: Anda tidak memiliki izin untuk melakukan aksi ini.'
      });
    }
    next();
  };
};

module.exports = authorize;