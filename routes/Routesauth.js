import { Router } from "express";
import { register, login } from "../controllers/authController.js";
import {
  demandeResetPassword,
  resetPassword,
} from "../controllers/authController.js";
import passport from "passport";

const router = Router();

// Inscription et Connexion
router.post("/register", register);
router.post("/login", login);

// Réinitialisation du mot de passe
router.post("/request-reset", demandeResetPassword);
router.post("/reset-password/:resetToken", resetPassword);

// Connexion Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login?error=google" }),
  (req, res) => {
    if (!req.user) {
      console.error("❌ Google Auth échoué : req.user est undefined.");
      return res.redirect("/login?error=google");
    }
    req.session.user = req.user; // Ajout de l'utilisateur à la session
    console.log("✅ Google Auth réussi :", req.user);
    res.redirect("/dashboard");
  }
);

// Connexion GitHub
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);
router.get(
  "/github/callback",
  (req, res, next) => {
    console.log("✅ Route `/api/auth/github/callback` appelée !");
    next();
  },
  passport.authenticate("github", { failureRedirect: "/login?error=github" }),
  (req, res) => {
    if (!req.user) {
      console.error("❌ GitHub Auth échoué : req.user est undefined.");
      return res.redirect("/login?error=github");
    }
    req.session.user = req.user; // Ajout de l'utilisateur à la session
    console.log("✅ GitHub Auth réussi :", req.user);
    res.redirect("/dashboard");
  }
);

// Ajout de la nouvelle route GitHub callback demandée
router.get("/github/callback", (req, res, next) => {
  console.log("✅ Route `/api/auth/github/callback` bien appelée !");
  next();
}, passport.authenticate("github", { failureRedirect: "/login?error=github" }), (req, res) => {
  if (!req.user) {
    console.error("❌ GitHub Auth échoué : req.user est undefined.");
    return res.redirect("/login?error=github");
  }
  req.session.user = req.user;
  console.log("✅ GitHub Auth réussi :", req.user);
  res.redirect("/dashboard");
});

// Vérification rapide
router.get("/status", (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    console.error("❌ Aucun utilisateur connecté.");
    res.json({ user: "Non connecté" });
  }
});

router.get("/github/callback/test", (req, res) => {
  res.send("✅ Express reconnaît bien cette route !");
});


export default router;
