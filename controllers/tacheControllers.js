import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

// Liste de mots dangereux pour bloquer certaines tâches
const motsDangereux = ["violence", "piratage", "fraude", "danger"];

// Création d'une tâche (l'utilisateur choisit sa priorité)
export async function creerTache(req, res) {
  const { titre, description, dateEcheance, priorite, estPrive } = req.body;
  const userId = req.user?.userId;

  if (!userId || !titre || !description || !dateEcheance || !priorite) {
    return res.status(400).json({ error: "Tous les champs sont requis." });
  }

  // Vérifier si la description contient un mot interdit → Bloque la tâche
  const contientMotDangereux = motsDangereux.some((mot) =>
    description?.includes(mot)
  );

  try {
    const nouvelleTache = await prisma.tache.create({
      data: {
        titre,
        description,
        dateEcheance: new Date(dateEcheance),
        priorite, // L’utilisateur choisit lui-même `low/medium/high`
        statut: "en cours",
        userId,
        estPrive,
        bloquee: contientMotDangereux, // Bloque si un mot interdit est détecté
      },
    });

    // Alerte admin si une tâche est bloquée
    if (contientMotDangereux) {
      console.log(`ALERTE : Tâche bloquée (${titre})`);
    }

    res.status(201).json(nouvelleTache);
  } catch (error) {
    console.error(" Erreur création tâche :", error);
    res.status(500).json({ error: "Erreur serveur, veuillez réessayer." });
  }
}

// Liste des tâches (exclut celles bloquées pour les utilisateurs)
export async function listerTaches(req, res) {
  const userId = req.user?.userId;
  const role = req.user?.role;

  if (!userId) return res.status(401).json({ error: "Accès non autorisé." });

  const { priorite, statut, dateEcheance } = req.query;

  // L'admin ne peut **PAS** voir les tâches privées, mais peut voir les bloquées
  const filtreBase =
    role === "administrateur"
      ? { estPrive: false } // Admin voit **tout sauf les privées**
      : { userId, bloquee: false }; // Utilisateur voit ses propres tâches, sauf si bloquées
  const filtre = {
    ...filtreBase,
    ...(priorite && { priorite }),
    ...(statut && { statut }),
    ...(dateEcheance && { dateEcheance: new Date(dateEcheance) }),
  };
  try {
    const taches = await prisma.tache.findMany({
      where: filtre,
      orderBy: { dateEcheance: "asc" },
    });
    res.json(taches);
  } catch (error) {
    console.error("Erreur récupération tâches :", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des tâches." });
  }
}

// Seul l’admin peut **bloquer/débloquer** une tâche
export async function bloquerTache(req, res) {
  const role = req.user?.role;
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
    res.json({ message: "Tâche bloquée avec succès." });
  } catch (error) {
    console.error("Erreur blocage tâche :", error);
    res.status(500).json({ error: "Erreur serveur lors du blocage." });
  }
}

export async function debloquerTache(req, res) {
  const role = req.user?.role;
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
    res.json({ message: "Tâche débloquée avec succès." });
  } catch (error) {
    console.error("Erreur déblocage tâche :", error);
    res.status(500).json({ error: "Erreur serveur lors du déblocage." });
  }
}

export async function modifierTache(req, res) {
  const { id } = req.params;
  const { titre, description, priorite, statut, bloquee } = req.body;
  const userRole = req.user.role; // Récupérer le rôle de l'utilisateur

  try {
    const tache = await prisma.tache.findUnique({
      where: { id: parseInt(id) },
    });

    if (!tache) {
      return res.status(404).json({ error: "Tâche introuvable." });
    }

    // Un utilisateur ne peut PAS modifier une tâche bloquée
    if (tache.bloquee && userRole !== "administrateur") {
      return res
        .status(403)
        .json({
          error: "Cette tâche est bloquée et ne peut pas être modifiée.",
        });
    }

    // Seul un administrateur peut modifier le statut `bloquee`
    if (bloquee !== undefined && userRole !== "administrateur") {
      return res
        .status(403)
        .json({
          error: "Seul un administrateur peut bloquer ou débloquer une tâche.",
        });
    }

    const tacheModifiee = await prisma.tache.update({
      where: { id: parseInt(id) },
      data: { titre, description, priorite, statut, bloquee },
    });

    res.json(tacheModifiee);
  } catch (error) {
    console.error("❌ Erreur modification tâche :", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
}

// L’admin peut **supprimer toutes les tâches**, même les bloquées
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
    res.json({ message: "Tâche supprimée avec succès." });
  } catch (error) {
    console.error("Erreur suppression tâche :", error);
    res.status(500).json({ error: "Erreur serveur lors de la suppression." });
  }
}
