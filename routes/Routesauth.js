import { Router } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import {
  register,
  login,
  demandeResetPassword,
  resetPassword,
  supprimerCompte,
  updatePassword,
  updateUserProfile,
} from "../controllers/authController.js";

import { verifierToken } from "../middlewares/authMiddleware.js"; // ← middleware pour sécuriser la suppression

const router = Router();

// Auth classique
router.post("/register", register);
router.post("/login", login);

// Réinitialisation mot de passe
router.post("/request-reset", demandeResetPassword);
router.post("/reset-password/:resetToken", resetPassword);

// Auth Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login?error=google",
    session: false,
  }),
  (req, res) => {
    if (!req.user) return res.redirect("/login?error=google");

    const token = jwt.sign(
      { userId: req.user.id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }
);

// Auth GitHub
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email", "read:user"] })
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: "/login?error=github",
    session: false,
  }),
  (req, res) => {
    if (!req.user) return res.redirect("/login?error=github");

    const token = jwt.sign(
      { userId: req.user.id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }
);

// Statut de session
router.get("/status", (req, res) => {
  res.json({ user: req.user || "Non connecté" });
});

// Suppression du compte connecté
router.delete("/auth/supprimer", verifierToken, supprimerCompte);

// Déconnexion
router.post("/logout", (req, res) => {
  // Supprimer le cookie JWT
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", 
    sameSite: "lax",
    maxAge: 0,
  });

  return res.json({ message: "Déconnexion réussie" });
});

// Mise à jour du mot de passe
router.put("/update-password", verifierToken, updatePassword);

// Mise à jour du profil utilisateur
router.put('/update-profile', verifierToken, updateUserProfile);

export default router;
