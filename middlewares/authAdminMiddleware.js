export function authAdminMiddleware(req, res, next) {
  if (req.user.role !== "administrateur") {
    return res
      .status(403)
      .json({ error: "Accès interdit : Administrateurs uniquement." });
  }
  next();
}
