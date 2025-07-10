// routes/adminRoutes.js
import { Router } from "express"
import { verifierToken as authMiddleware, authAdminMiddleware } from "../middlewares/authMiddleware.js"
import { getAllUtilisateurs, updateUserRole } from "../controllers/authController.js"
import { ensureAdmin } from "../middlewares/ensureAdmin.js"
import { getLogs } from "../controllers/logController.js"


const adminRouter = Router()

adminRouter.use(authMiddleware)
adminRouter.use("/utilisateurs", authAdminMiddleware)

adminRouter.get("/dashboard", (req, res) => {
  res.json({ message: "Statistiques admin" })
})

adminRouter.get("/utilisateurs", getAllUtilisateurs)
adminRouter.put("/utilisateurs/:id/role", updateUserRole)

adminRouter.get("/logs", ensureAdmin, getLogs)

export default adminRouter
