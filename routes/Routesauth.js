import { Router } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import {
  register,
  login,
  demandeResetPassword,
  resetPassword,
} from "../controllers/authController.js";

const router = Router();

//  Auth classique 
router.post("/register", register);
router.post("/login", login);

//  Réinitialisation mot de passe 
router.post("/request-reset", demandeResetPassword);
router.post("/reset-password/:resetToken", resetPassword);

//  Google Auth 
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login?error=google",
    session: false, // Important : désactive la session
  }),
  (req, res) => {
    if (!req.user) return res.redirect("/login?error=google");

    const token = jwt.sign(
      { userId: req.user.id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}`);
  }
);

//  GitHub Auth 
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

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}`);
  }
);

//  Statut 
router.get("/status", (req, res) => {
  res.json({ user: req.user || "Non connecté" });
});

export default router;
