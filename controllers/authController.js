import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";
import { envoyerEmail } from "../config/nodemailer.js";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

dotenv.config();
console.log(" DATABASE_URL utilisée :", process.env.DATABASE_URL);

const prisma = new PrismaClient();

// ➤ Inscription
export async function register(req, res) {
  const { nomUtilisateur, email, password, role } = req.body;
  if (!nomUtilisateur || !email || !password) {
    return res.status(400).json({ error: "Tous les champs sont requis." });
  }

  try {
    const utilisateurExistant = await prisma.utilisateur.findUnique({
      where: { email },
    });
    if (utilisateurExistant) {
      return res.status(400).json({ error: "Cet email est déjà utilisé." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.utilisateur.create({
      data: {
        nomUtilisateur,
        email,
        password: hashedPassword,
        role: role || "utilisateur",
      },
    });

    try {
      // Mail utilisateur
      await envoyerEmail("bienvenue", email, { nom: nomUtilisateur });

      // Mail admin différent
      await envoyerEmail("nouvelleInscriptionAdmin", process.env.EMAIL_ADMIN, {
        nom: nomUtilisateur,
        email: email,
      });
    } catch (err) {
      console.warn(" Erreur lors de l'envoi des emails :", err.message);
    }

    res.status(201).json({ message: "Inscription réussie !" });
  } catch (error) {
    console.error(" Erreur inscription :", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
}

// ➤ Connexion
export async function login(req, res) {
  const { email, password } = req.body;

  try {
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { email },
    });
    if (
      !utilisateur ||
      !(await bcrypt.compare(password, utilisateur.password))
    ) {
      return res.status(401).json({ error: "Identifiants incorrects." });
    }

    const token = jwt.sign(
      { userId: utilisateur.id, role: utilisateur.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (error) {
    console.error(" Erreur connexion :", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
}

// ========== RESET MOT DE PASSE ==========

// ➤ Demande de reset
export async function demandeResetPassword(req, res) {
  const { email } = req.body;

  try {
    const user = await prisma.utilisateur.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "Email non trouvé." });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiration = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    await prisma.utilisateur.update({
      where: { email },
      data: { resetToken, resetTokenExp: expiration },
    });

    const resetLink = `${process.env.BASE_URL}/api/auth/reset-password/${resetToken}`;
    await envoyerEmail("reset", email, {
      nom: user.nomUtilisateur,
      lien: resetLink,
    });

    res.json({ message: "Email de réinitialisation envoyé." });
  } catch (error) {
    console.error(" Erreur demande reset :", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
}

// ➤ Réinitialisation
export async function resetPassword(req, res) {
  const { resetToken } = req.params;
  const { newPassword } = req.body;

  try {
    const user = await prisma.utilisateur.findFirst({ where: { resetToken } });

    if (!user || !user.resetTokenExp || user.resetTokenExp < new Date()) {
      return res.status(400).json({ error: "Token invalide ou expiré." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.utilisateur.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExp: null,
      },
    });

    res.json({ message: "Mot de passe mis à jour avec succès." });
  } catch (error) {
    console.error(" Erreur reset password :", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
}

// ========== PROVIDERS ==========

// ➤ Google
export async function saveGoogleUser(userData) {
  const email = userData.emails?.[0]?.value;
  if (!email) return;

  try {
    const existingUser = await prisma.utilisateur.findUnique({
      where: { email },
    });

    if (!existingUser) {
      const newUser = await prisma.utilisateur.create({
        data: {
          nomUtilisateur: userData.displayName || "Utilisateur Google",
          email,
          password: crypto.randomBytes(16).toString("hex"),
          provider: "google",
          role: "utilisateur",
        },
      });

      await envoyerEmail("bienvenue", email, { nom: newUser.nomUtilisateur });

      console.log(" Utilisateur Google créé :", email);
    }
  } catch (error) {
    console.error(" Erreur enregistrement Google :", error);
  }
}

// ➤ GitHub
export async function saveGitHubUser(userData) {
  const email = userData.emails?.[0]?.value;
  if (!email) return;

  try {
    const existingUser = await prisma.utilisateur.findUnique({
      where: { email },
    });

    if (!existingUser) {
      const newUser = await prisma.utilisateur.create({
        data: {
          nomUtilisateur: userData.displayName || "Utilisateur GitHub",
          email,
          password: crypto.randomBytes(16).toString("hex"),
          provider: "github",
          role: "utilisateur",
        },
      });

      await envoyerEmail("bienvenue", email, { nom: newUser.nomUtilisateur });

      console.log(" Utilisateur GitHub créé :", email);
    }
  } catch (error) {
    console.error(" Erreur enregistrement GitHub :", error);
  }
}
