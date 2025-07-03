import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default prisma

export function isUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentification requise." });
  }
  next();
}
export function isAdmin(req, res, next) {
  if (req.user.role !== "administrateur") {
    return res.status(403).json({ error: "Accès refusé. Admin requis." });
  }
  next();
}
export async function canDeleteTask(req, res, next) {
  const { id } = req.params;
  const userId = req.user.userId;
  try {
    const tache = await prisma.tache.findUnique({ where: { id: Number(id) } });

    if (!tache) {
      return res.status(404).json({ error: "Tâche non trouvée." });
    }
    if (tache.userId !== userId && req.user.role !== "administrateur") {
      return res.status(403).json({
        error: "Accès refusé. Vous ne pouvez supprimer que vos propres tâches.",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur." });
  }
}
