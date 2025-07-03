import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Accès non autorisé. Veuillez vous connecter." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId }; // Ajout de l'id utilisateur dans la requête
    next();
  } catch (error) {
    return res.status(401).json({ error: "Jeton invalide ou expiré." });
  }
};