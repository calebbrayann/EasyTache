import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default prisma;

// Middleware pour vérifier si l'utilisateur est authentifié
export function isUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentification requise. Veuillez vous connecter." });
  }
  next();
}

// Middleware pour vérifier si l'utilisateur est un administrateur
export function isAdmin(req, res, next) {
  if (req.user.role !== "administrateur") {
    return res.status(403).json({ error: "Accès refusé. Administrateur requis pour cette action." });
  }
  next();
}

// Middleware pour vérifier si l'utilisateur peut supprimer une tâche (soit s'il est le propriétaire de la tâche, soit un administrateur)
export async function canDeleteTask(req, res, next) {
  const { id } = req.params;
  const userId = req.user?.userId; // Assurer que req.user est bien défini

  if (!userId) {
    return res.status(401).json({ error: "Authentification requise." });
  }

  try {
    const tache = await prisma.tache.findUnique({ where: { id: Number(id) } });

    if (!tache) {
      return res.status(404).json({ error: "Tâche non trouvée. Impossible de supprimer une tâche inexistante." });
    }

    // Vérification si l'utilisateur est le propriétaire de la tâche ou un administrateur
    if (tache.userId !== userId && req.user.role !== "administrateur") {
      return res.status(403).json({
        error: "Accès refusé. Vous ne pouvez supprimer que vos propres tâches, ou vous devez être administrateur.",
      });
    }

    next(); // Si tout est valide, on passe au prochain middleware
  } catch (error) {
    console.error("Erreur dans le middleware canDeleteTask :", error);
    res.status(500).json({ error: "Erreur serveur lors de la vérification de la tâche." });
  }
}
