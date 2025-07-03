import { Router } from "express";
import { authMiddleware, authAdminMiddleware } from "../middlewares/authMiddleware.js";
import { getAllUtilisateurs, updateUserRole } from "../controllers/authController.js";

const router = Router();

// Routes nécessitant une authentification, mais pas forcément un rôle admin
router.use(authMiddleware);  // Pour toutes les routes qui nécessitent l'authentification

// Routes nécessitant un rôle admin
router.use("/utilisateurs", authAdminMiddleware);  // Seulement pour les routes d'administration

router.get("/dashboard", (req, res) => {
  res.json({ message: "Statistiques admin" });
});

// Récupération de tous les utilisateurs (accès admin)
router.get("/utilisateurs", getAllUtilisateurs);

// Mise à jour du rôle d'un utilisateur (accès admin)
router.put("/utilisateurs/:id/role", updateUserRole);

export default router;
