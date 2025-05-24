import { Router } from "express";
import { register, login } from "../controllers/authController.js";
import {
  demandeResetPassword,
  resetPassword,
} from "../controllers/authController.js";
import passport from "passport";
import { saveGoogleUser, saveGitHubUser } from "../controllers/authController.js"; // Ajout de `saveGitHubUser`

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
  (req, res, next) => {
    console.log("Route `/api/auth/google` bien appelée !");
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  (req, res, next) => {
    console.log("Route `/api/auth/google/callback` bien appelée !");
    next();
  },
  passport.authenticate("google", { failureRedirect: "/login?error=google" }),
  async (req, res) => {
    console.log("Données reçues de Google :", req.user);
    if (!req.user) {
      console.error("Google Auth échoué : req.user est undefined.");
      return res.redirect("/login?error=google");
    }

    // Enregistrement de l'utilisateur Google dans la base de données
    await saveGoogleUser(req.user);
    req.session.user = req.user;
    console.log(" Google Auth réussi :", req.user);
    res.redirect("/dashboard");
  }
);

// Connexion GitHub
router.get(
  "/github",
  (req, res, next) => {
    console.log("✅ Route `/api/auth/github` bien appelée !");
    next();
  },
  passport.authenticate("github", { scope: ["user:email", "read:user"] }) // Ajout de `"read:user"`
);

router.get(
  "/github/callback",
  (req, res, next) => {
    console.log("Route `/api/auth/github/callback` bien appelée !");
    next();
  },
  passport.authenticate("github", { failureRedirect: "/login?error=github" }),
  async (req, res) => {
    console.log("Données brutes de GitHub :", JSON.stringify(req.user, null, 2));

    if (!req.user) {
      console.error("GitHub Auth échoué : req.user est undefined.");
      return res.redirect("/login?error=github");
    }

    // Enregistrement de l'utilisateur GitHub dans la base de données
    await saveGitHubUser(req.user); // Ajout du stockage utilisateur

    req.session.user = req.user;
    console.log("GitHub Auth réussi :", req.user);
    res.redirect("/dashboard");
  }
);

// Ajout de la nouvelle route de test pour Google
router.get("/google/callback/test", (req, res) => {
  res.send("Express reconnaît bien cette route !");
});

// Vérification rapide
router.get("/status", (req, res) => {
  console.log(" Vérification session : ", req.session);
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    console.error("Session perdue !");
    res.json({ user: "Non connecté" });
  }
});

export default router;
