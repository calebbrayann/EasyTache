export function authAdminMiddleware(req, res, next) {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Accès interdit : Administrateurs uniquement." });
  }
  next();
}
