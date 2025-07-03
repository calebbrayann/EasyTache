// middlewares/authMiddleware.js
import jwt from "jsonwebtoken"

// Vérifie que l'utilisateur est connecté (authentification basique)
export const verifierToken = (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "Accès non autorisé. Veuillez vous connecter." })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { userId: decoded.userId, role: decoded.role }
    next()
  } catch (error) {
    return res.status(401).json({ error: "Jeton invalide ou expiré." })
  }
}

// Vérifie que l'utilisateur est un administrateur
export const authAdminMiddleware = (req, res, next) => {
  if (req.user?.role !== "administrateur") {
    return res.status(403).json({ error: "Accès refusé. Admin requis." })
  }
  next()
}
