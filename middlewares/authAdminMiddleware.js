export function authAdminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentification requise. Veuillez vous connecter." });
  }
  if (req.user.role !== "administrateur") {
    return res.status(403).json({ error: "Accès interdit : Seuls les administrateurs peuvent accéder à cette ressource." });
  }
  next();
}
