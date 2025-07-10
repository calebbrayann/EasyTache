import pkg from "@prisma/client";
import sanitizeHtml from "sanitize-html"; // Protection XSS
import { enregistrerLog } from "./logController.js"; // <-- import ajouté
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

// Fonction de nettoyage XSS
function nettoyerTexte(texte) {
  return sanitizeHtml(texte, { allowedTags: [], allowedAttributes: {} });
}

// Liste simple de mots sensibles (à adapter selon ton app)
const motsDangereux = ["bombe", "violence", "haine", "interdit"];

export async function creerTache(req, res) {
  const { title, description, dueDate, priority, visibility } = req.body;
  const userId = req.user?.userId;

  if (!userId || !title || !description || !dueDate || !priority) {
    return res.status(400).json({ error: "Tous les champs sont requis." });
  }

  const titreNettoye = nettoyerTexte(title);
  const descriptionNettoyee = nettoyerTexte(description);

  const contientMotDangereux = motsDangereux.some((mot) =>
    descriptionNettoyee.toLowerCase().includes(mot)
  );

  try {
    const nouvelleTache = await prisma.tache.create({
      data: {
        titre: titreNettoye,
        description: descriptionNettoyee,
        dateEcheance: new Date(dueDate),
        priorite: priority,
        statut: "en_cours",
        userId: userId,
        estPrive: visibility === "private",
        bloquee: contientMotDangereux,
      },
    });

    if (contientMotDangereux) {
      console.log(` ALERTE : Tâche bloquée automatiquement : "${titreNettoye}"`);
    }

    await enregistrerLog(userId, `Création tâche id=${nouvelleTache.id}`);

    return res.status(201).json(nouvelleTache);
  } catch (error) {
    console.error(" Erreur création tâche :", error);
    return res
      .status(500)
      .json({ error: "Erreur serveur lors de la création de la tâche." });
  }
}

export async function listerTaches(req, res) {
  const userId = req.user?.userId;
  const role = req.user?.role;

  if (!userId) return res.status(401).json({ error: "Accès non autorisé." });

  const { priorite, statut, dateEcheance, bloquee } = req.query;

  const filtreBase =
    role === "administrateur" ? {} : { userId, bloquee: false };

  const filtre = {
    ...filtreBase,
    ...(priorite && { priorite }),
    ...(statut && { statut }),
    ...(dateEcheance && { dateEcheance: new Date(dateEcheance) }),
    ...(bloquee !== undefined && { bloquee: bloquee === "true" }),
  };

  try {
    const taches = await prisma.tache.findMany({
      where: filtre,
      orderBy: { dateEcheance: "asc" },
    });

    await enregistrerLog(userId, "Consultation tâches");

    res.json(taches);
  } catch (error) {
    console.error("Erreur récupération tâches :", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des tâches." });
  }
}

export async function bloquerTache(req, res) {
  const role = req.user?.role;
  const userId = req.user?.userId;
  const { id } = req.params;

  if (role !== "administrateur") {
    return res
      .status(403)
      .json({ error: "Seul l’admin peut bloquer une tâche." });
  }

  try {
    await prisma.tache.update({
      where: { id: Number(id) },
      data: { bloquee: true },
    });

    await enregistrerLog(userId, `Blocage tâche id=${id}`);

    res.json({ message: "Tâche bloquée avec succès." });
  } catch (error) {
    console.error("Erreur blocage tâche :", error);
    res.status(500).json({ error: "Erreur serveur lors du blocage." });
  }
}

export async function debloquerTache(req, res) {
  const role = req.user?.role;
  const userId = req.user?.userId;
  const { id } = req.params;

  if (role !== "administrateur") {
    return res
      .status(403)
      .json({ error: "Seul l’admin peut débloquer une tâche." });
  }

  try {
    await prisma.tache.update({
      where: { id: Number(id) },
      data: { bloquee: false },
    });

    await enregistrerLog(userId, `Déblocage tâche id=${id}`);

    res.json({ message: "Tâche débloquée avec succès." });
  } catch (error) {
    console.error("Erreur déblocage tâche :", error);
    res.status(500).json({ error: "Erreur serveur lors du déblocage." });
  }
}

export async function modifierTache(req, res) {
  const { id } = req.params;
  const { titre, description, priorite, statut, bloquee } = req.body;
  const userRole = req.user.role;
  const userId = req.user.userId;

  try {
    const tache = await prisma.tache.findUnique({
      where: { id: parseInt(id) },
    });

    if (!tache) {
      return res.status(404).json({ error: "Tâche introuvable." });
    }

    if (tache.bloquee && userRole !== "administrateur") {
      return res.status(403).json({
        error: "Cette tâche est bloquée et ne peut pas être modifiée.",
      });
    }

    if (bloquee !== undefined && userRole !== "administrateur") {
      return res.status(403).json({
        error: "Seul un administrateur peut bloquer ou débloquer une tâche.",
      });
    }

    const titreNettoye = titre ? nettoyerTexte(titre) : undefined;
    const descriptionNettoyee = description
      ? nettoyerTexte(description)
      : undefined;

    const tacheModifiee = await prisma.tache.update({
      where: { id: parseInt(id) },
      data: {
        ...(titre && { titre: titreNettoye }),
        ...(description && { description: descriptionNettoyee }),
        ...(priorite && { priorite }),
        ...(statut && { statut }),
        ...(bloquee !== undefined && { bloquee }),
      },
    });

    await enregistrerLog(userId, `Modification tâche id=${id}`);

    res.json(tacheModifiee);
  } catch (error) {
    console.error("Erreur modification tâche :", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
}

export async function supprimerTache(req, res) {
  const userId = req.user?.userId;
  const role = req.user?.role;
  const { id } = req.params;

  if (!userId || !id) return res.status(400).json({ error: "ID requis." });

  try {
    const tacheExistante = await prisma.tache.findUnique({
      where: { id: Number(id) },
    });

    if (
      !tacheExistante ||
      (tacheExistante.userId !== userId && role !== "administrateur")
    ) {
      return res
        .status(404)
        .json({ error: "Tâche non trouvée ou accès refusé." });
    }

    await prisma.tache.delete({ where: { id: Number(id) } });

    await enregistrerLog(userId, `Suppression tâche id=${id}`);

    res.json({ message: "Tâche supprimée avec succès." });
  } catch (error) {
    console.error("Erreur suppression tâche :", error);
    res.status(500).json({ error: "Erreur serveur lors de la suppression." });
  }
}

export const getTacheById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  try {
    const tache = await prisma.tache.findUnique({ where: { id: Number(id) } });

    if (!tache) {
      return res.status(404).json({ error: "Tâche non trouvée" });
    }

    await enregistrerLog(userId, `Consultation tâche id=${id}`);

    return res.status(200).json(tache);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};
