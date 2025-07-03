// routes/tacheRoutes.js
import { Router } from "express"
import * as tacheController from "../controllers/tacheControllers.js"
import { verifierToken as authMiddleware } from "../middlewares/authMiddleware.js"
import { authAdminMiddleware } from "../middlewares/authAdminMiddleware.js"
import { canDeleteTask } from "../middlewares/roleMiddleware.js"

const tacheRouter = Router()

tacheRouter.use(authMiddleware)

tacheRouter.get("/", tacheController.listerTaches)
tacheRouter.post("/", tacheController.creerTache)
tacheRouter.put("/:id", tacheController.modifierTache)
tacheRouter.delete("/:id", canDeleteTask, tacheController.supprimerTache)
tacheRouter.patch("/:id/bloquer", authAdminMiddleware, tacheController.bloquerTache)
tacheRouter.patch("/:id/debloquer", authAdminMiddleware, tacheController.debloquerTache)
tacheRouter.get("/taches/:id", tacheController.getTacheById)

export default tacheRouter
