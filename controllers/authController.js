import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import nodemailer from "nodemailer";
import crypto from "crypto";
import dotenv from "dotenv";
import { envoyerEmail } from "../config/nodemailer.js";

dotenv.config();
const prisma = new PrismaClient();

;

// Configuration Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Correction ici
    pass: process.env.EMAIL_PASS, // Correction ici
  },
});

// Vérification de la connexion SMTP
async function verifierSMTP() {
  try {
    await transporter.verify();
    console.log("Connexion SMTP réussie");
  } catch (error) {
    console.error("Erreur de connexion SMTP :", error);
    throw new Error("Service email indisponible, abandon de l'envoi.");
  }
}

// Envoi du mail de bienvenue
async function envoyerEmailBienvenue(email, nomUtilisateur) {
  try {
    await verifierSMTP();
    console.log("Tentative d’envoi de l’email à :", email);

    const message = {
      from: process.env.EMAIL_USER, // Correction ici
      to: email,
      subject: "Bienvenue sur notre plateforme",
      text: `Salut ${nomUtilisateur}, bienvenue chez nous ! Nous sommes ravis de t'avoir avec nous.`,
    };

    await transporter.sendMail(message);
    console.log("Email de bienvenue envoyé !");
  } catch (error) {
    console.error("Erreur envoi email :", error);
    throw new Error("Échec de l'envoi du mail.");
  }
}

// Inscription utilisateur avec envoi d’email de bienvenue
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
    const nouvelUtilisateur = await prisma.utilisateur.create({
      data: {
        nomUtilisateur,
        email,
        password: hashedPassword,
        role: role || "utilisateur",
      },
    });

    try {
      console.log("Tentative d’envoi d’email à :", email);
      await envoyerEmailBienvenue(email, nomUtilisateur);
      console.log("Email de bienvenue envoyé !");
    } catch (error) {
      console.error("L'e-mail de bienvenue n'a pas pu être envoyé :", error);
    }

    res.status(201).json({ message: "Inscription réussie !" });
  } catch (error) {
    console.error(" Erreur inscription :", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
}


// Connexion utilisateur
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
    console.error("Erreur connexion :", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
}

// Demande de réinitialisation du mot de passe
export async function demandeResetPassword(req, res) {
  const { email } = req.body;
  try {
    const user = await prisma.utilisateur.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "Email non trouvé." });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + 30);

    await prisma.utilisateur.update({
      where: { email },
      data: { resetToken, resetTokenExp: expiration },
    });

    const resetLink = `${process.env.BASE_URL}/api/auth/reset-password/${resetToken}`;
    await envoyerEmail(user.email, resetLink);
    res.json({ message: "Email de réinitialisation envoyé." });
  } catch (error) {
    console.error("Erreur demande reset :", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
}

// Réinitialisation du mot de passe
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
      data: { password: hashedPassword, resetToken: null, resetTokenExp: null },
    });

    res.json({ message: "Mot de passe mis à jour avec succès." });
  } catch (error) {
    console.error("Erreur reset password :", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
}
