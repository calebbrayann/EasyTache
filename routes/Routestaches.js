import { Router } from "express";
import * as tacheController from "../controllers/tacheControllers.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", tacheController.listerTaches);
router.post("/", tacheController.creerTache);
router.put("/:id", tacheController.modifierTache);
router.delete("/:id", tacheController.supprimerTache);

export default router;
