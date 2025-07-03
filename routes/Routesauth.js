// routes/authRoutes.js
import { Router } from "express"
import passport from "passport"
import jwt from "jsonwebtoken"
import {
  register,
  login,
  demandeResetPassword,
  resetPassword,
  supprimerCompte,
  updatePassword,
  updateUserProfile,
} from "../controllers/authController.js"
import { verifierToken } from "../middlewares/authMiddleware.js"
import { activate } from "../controllers/authController.js"; 

const authRouter = Router()

// Auth classique
authRouter.post("/register", register)
authRouter.post("/login", login)

// Réinitialisation mot de passe
authRouter.post("/request-reset", demandeResetPassword)
authRouter.post("/reset-password/:resetToken", resetPassword)

// Suppression du compte
authRouter.delete("/supprimer", verifierToken, supprimerCompte)

// Mise à jour du mot de passe & profil
authRouter.put("/update-password", verifierToken, updatePassword)
authRouter.put("/update-profile", verifierToken, updateUserProfile)

// Auth Google
authRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }))
authRouter.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login?error=google", session: false }),
  (req, res) => {
    if (!req.user) return res.redirect("/login?error=google")
    const token = jwt.sign(
      { userId: req.user.id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    )
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    })
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`)
  }
)

// Auth GitHub
authRouter.get("/github", passport.authenticate("github", { scope: ["user:email", "read:user"] }))
authRouter.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/login?error=github", session: false }),
  (req, res) => {
    if (!req.user) return res.redirect("/login?error=github")
    const token = jwt.sign(
      { userId: req.user.id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    )
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    })
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`)
  }
)

// Statut de session
authRouter.get("/status", (req, res) => {
  res.json({ user: req.user || "Non connecté" })
})

// Déconnexion
authRouter.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
  })
  res.json({ message: "Déconnexion réussie" })
})

export default authRouter

