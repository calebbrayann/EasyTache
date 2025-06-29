import { Router } from "express";
import passport from "passport";
import {
  register,
  login,
  demandeResetPassword,
  resetPassword,
  saveGoogleUser,
  saveGitHubUser,
} from "../controllers/authController.js";

const router = Router();

// ========== Auth classique ==========
router.post("/register", register);
router.post("/login", login);

// ========== Réinitialisation mot de passe ==========
router.post("/request-reset", demandeResetPassword);
router.post("/reset-password/:resetToken", resetPassword);

// ========== Google Auth ==========
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login?error=google" }),
  async (req, res) => {
    if (!req.user) return res.redirect("/login?error=google");

    await saveGoogleUser(req.user);
    req.session.user = req.user;
    res.redirect("/dashboard");
  }
);

// ========== GitHub Auth ==========
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email", "read:user"] })
);

router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/login?error=github" }),
  async (req, res) => {
    if (!req.user) return res.redirect("/login?error=github");

    await saveGitHubUser(req.user);
    req.session.user = req.user;
    res.redirect("/dashboard");
  }
);

// ========== Statut session ==========
router.get("/status", (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.json({ user: "Non connecté" });
  }
});

export default router;
