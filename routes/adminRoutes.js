import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";           // import par défaut
import { authAdminMiddleware } from "../middlewares/authAdminMiddleware.js"; // import nommé

const router = Router();

router.use(authMiddleware);
router.use(authAdminMiddleware);

router.get("/dashboard", (req, res) => {
  res.json({ message: "Statistiques admin" });
});

export default router;
