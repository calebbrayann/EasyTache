import { Router } from "express";
import * as tacheController from "../controllers/tacheControllers.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", tacheController.listerTaches);
router.post("/", tacheController.creerTache);
router.put("/:id", tacheController.modifierTache);
router.delete("/:id", tacheController.supprimerTache);

// Routes admin pour bloquer/débloquer une tâche
router.patch("/:id/bloquer", authAdminMiddleware, tacheController.bloquerTache);
router.patch("/:id/debloquer", authAdminMiddleware, tacheController.debloquerTache);


export default router;
