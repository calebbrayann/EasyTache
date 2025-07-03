import { Router } from "express";
import * as tacheController from "../controllers/tacheControllers.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { authAdminMiddleware } from "../middlewares/authAdminMiddleware.js";
import { canDeleteTask } from "../middlewares/roleMiddleware.js" ;

const router = Router();

// Middleware d'authentification
router.use(authMiddleware);

router.get("/", tacheController.listerTaches);
router.post("/", tacheController.creerTache);
router.put("/:id", tacheController.modifierTache);

// Suppression d'une tâche (avec vérification si l'utilisateur peut la supprimer)
router.delete("/:id", canDeleteTask, tacheController.supprimerTache);

// Routes admin pour bloquer/débloquer une tâche
router.patch("/:id/bloquer", authAdminMiddleware, tacheController.bloquerTache);
router.patch("/:id/debloquer", authAdminMiddleware, tacheController.debloquerTache);

router.get('/taches/:id', taskController.getTacheById);

export default router;
