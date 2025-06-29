import jwt from "jsonwebtoken";

export default function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Token manquant, accès refusé." });
  }

  const token = authHeader.split(" ")[1]; // Extraction du token après "Bearer"
console.log("Token reçu :", req.headers.authorization);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; //  Stocke l'utilisateur dans `req.user`
    next(); // Passe à la prochaine étape
  } catch (error)
   {
    return res.status(401).json({ error: "Token invalide ou expiré." });
    
  } 
}
