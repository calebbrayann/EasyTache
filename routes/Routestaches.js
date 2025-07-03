import { Router } from "express";
import * as tacheController from "../controllers/tacheControllers.js";
import { authAdminMiddleware } from "../middlewares/authAdminMiddleware.js";
import { canDeleteTask } from "../middlewares/roleMiddleware.js";
import { authMiddleware } from "../middlewares/authMiddleware.js"; // Correctement importé

const router = Router();

// Middleware d'authentification
router.use(authMiddleware);

// Récupérer la liste des tâches
router.get("/", tacheController.listerTaches);

// Créer une nouvelle tâche
router.post("/", tacheController.creerTache);

// Modifier une tâche existante
router.put("/:id", tacheController.modifierTache);

// Suppression d'une tâche (avec vérification si l'utilisateur peut la supprimer)
router.delete("/:id", canDeleteTask, tacheController.supprimerTache);

// Routes admin pour bloquer/débloquer une tâche
router.patch("/:id/bloquer", authAdminMiddleware, tacheController.bloquerTache);
router.patch("/:id/debloquer", authAdminMiddleware, tacheController.debloquerTache);

// Récupérer une tâche spécifique par ID
router.get("/taches/:id", tacheController.getTacheById);

export default router;
