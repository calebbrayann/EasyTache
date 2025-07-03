// routes/adminRoutes.js
import { Router } from "express"
import { verifierToken as authMiddleware, authAdminMiddleware } from "../middlewares/authMiddleware.js"
import { getAllUtilisateurs, updateUserRole } from "../controllers/authController.js"

const adminRouter = Router()

adminRouter.use(authMiddleware)
adminRouter.use("/utilisateurs", authAdminMiddleware)

adminRouter.get("/dashboard", (req, res) => {
  res.json({ message: "Statistiques admin" })
})

adminRouter.get("/utilisateurs", getAllUtilisateurs)
adminRouter.put("/utilisateurs/:id/role", updateUserRole)

export default adminRouter
