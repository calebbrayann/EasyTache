import { Router } from "express";
import authMiddleware, { authAdminMiddleware } from "../middlewares/authMiddleware.js";
import { getAllUtilisateurs, updateUserRole } from "../controllers/authController.js";

const router = Router();

// Application du middleware authAdminMiddleware pour les routes sensibles
router.use(authMiddleware);
router.use(authAdminMiddleware);

router.get("/dashboard", (req, res) => {
  res.json({ message: "Statistiques admin" });
});

router.get("/utilisateurs", getAllUtilisateurs);

router.put("/utilisateurs/:id/role", updateUserRole);

export default router;
