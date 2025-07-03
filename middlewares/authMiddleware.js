import jwt from "jsonwebtoken";

// Middleware pour vérifier et valider le token JWT
export const verifierToken = (req, res, next) => {
  // Récupérer le token à partir des cookies ou de l'en-tête d'autorisation (format "Bearer token")
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Accès non autorisé. Veuillez vous connecter." });
  }

  try {
    // Vérifier et décoder le token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Vérifier que le token contient l'information nécessaire (ici, l'ID de l'utilisateur)
    if (!decoded.userId) {
      return res.status(401).json({ error: "Jeton invalide." });
    }

    // Ajouter les informations décodées dans la requête pour les utiliser dans les middlewares/routes suivantes
    req.user = { userId: decoded.userId, role: decoded.role };

    // Passer au middleware suivant
    next();
  } catch (error) {
    console.error("Erreur de vérification du jeton :", error);
    return res.status(401).json({ error: "Jeton invalide ou expiré. Veuillez vous reconnecter." });
  }
};
