import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authAdminMiddleware } from "../middlewares/authAdminMiddleware.js";

const router = Router();

router.use(authMiddleware);
router.use(authAdminMiddleware);

router.get("/dashboard", (req, res) => {
  res.json({ message: "Statistiques admin" });
});

export default router;
