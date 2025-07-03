import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";
import { envoyerEmail } from "../config/nodemailer.js";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

dotenv.config();
const prisma = new PrismaClient();

// ➤ Inscription
export async function register(req, res) {
  const { nomUtilisateur, email, password, confirmPassword, role } = req.body;

  // ➤ Vérification des champs obligatoires
  if (!nomUtilisateur || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: "Tous les champs sont requis." });
  }

  // ➤ Email invalide
  if (!validateEmail(email)) {
    return res.status(400).json({ error: "Format d'email invalide." });
  }

  // ➤ Les deux mots de passe doivent être identiques
  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Les mots de passe ne correspondent pas." });
  }

  // ➤ Optionnel : politique de mot de passe plus stricte
  if (password.length < 8 || !/\d/.test(password)) {
    return res.status(400).json({
      error: "Le mot de passe doit contenir au moins 8 caractères et un chiffre.",
    });
  }

  try {
    // ➤ Vérifier si l’utilisateur existe déjà
    const utilisateurExistant = await prisma.utilisateur.findUnique({ where: { email } });
    if (utilisateurExistant) {
      return res.status(400).json({ error: "Cet email est déjà utilisé." });
    }

    // ➤ Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // ➤ Créer l’utilisateur
    const utilisateur = await prisma.utilisateur.create({
      data: {
        nomUtilisateur,
        email,
        password: hashedPassword,
        role: role || "utilisateur",
        isActive: true, // ou false si activation par email
      },
    });

    // ➤ Envoi des emails
    const activationLink = `${process.env.BASE_URL}/api/auth/activate/${utilisateur.id}`;

    try {
      await envoyerEmail("bienvenue", email, {
        nom: nomUtilisateur,
        activationLink,
      });

      await envoyerEmail("nouvelleInscriptionAdmin", process.env.EMAIL_ADMIN, {
        nom: nomUtilisateur,
        email,
      });
    } catch (err) {
      console.warn("Échec de l'envoi des emails :", err.message);
    }

    return res.status(201).json({
      message: "Inscription réussie ! Un email de confirmation a été envoyé.",
    });
  } catch (error) {
    console.error("Erreur côté serveur lors de l'inscription :", error);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}


// ➤ Connexion
export async function login(req, res) {
  const { email, password } = req.body;

  try {
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { email },
    });

    // Vérifier si l'utilisateur existe et s'il est activé
    if (!utilisateur || !(await bcrypt.compare(password, utilisateur.password))) {
      return res.status(401).json({ error: "Identifiants incorrects." });
    }

    // Vérifier si l'utilisateur est activé
    if (!utilisateur.isActive) {
      return res.status(401).json({ error: "Votre compte n'est pas activé." });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { userId: utilisateur.id, role: utilisateur.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Envoyer le token dans un cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",  // Assure que le cookie est sécurisé en production
      sameSite: "Strict",  // Option plus sécurisée
      maxAge: 24 * 60 * 60 * 1000, // 1 jour
    });

    return res.json({ message: "Connexion réussie." });
  } catch (error) {
    console.error("Erreur connexion :", error);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}


// ➤ Statut de session
export async function getStatus(req, res) {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ connecté: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({
      connecté: true,
      userId: decoded.userId,
      role: decoded.role,
    });
  } catch (error) {
    res.status(401).json({ connecté: false });
  }
}

// ➤ Suppression du compte
export async function supprimerCompte(req, res) {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Non autorisé. Jeton manquant ou invalide." });
  }

  try {
    await prisma.utilisateur.delete({
      where: { id: userId },
    });

    res.json({ message: "Compte supprimé avec succès." });
  } catch (error) {
    console.error("Erreur suppression compte :", error);
    res.status(500).json({ error: "Erreur serveur lors de la suppression du compte." });
  }
}

// ➤ Demande de reset mot de passe
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
    console.error("Erreur demande reset :", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
}

// ➤ Réinitialisation mot de passe
export async function resetPassword(req, res) {
  const { resetToken } = req.params;
  const { newPassword } = req.body;

  try {
    const user = await prisma.utilisateur.findUnique({ where: { resetToken } });

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
    console.error("Erreur reset password :", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
}

// ➤ Enregistrement utilisateur Google
export async function saveGoogleUser(userData) {
  const email = userData.emails?.[0]?.value;
  if (!email) return;

  try {
    const existingUser = await prisma.utilisateur.findUnique({ where: { email } });

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

      console.log("Utilisateur Google créé :", email);
    }
  } catch (error) {
    console.error("Erreur enregistrement Google :", error);
  }
}

// ➤ Enregistrement utilisateur GitHub
export async function saveGitHubUser(userData) {
  const email = userData.emails?.[0]?.value;
  if (!email) return;

  try {
    const existingUser = await prisma.utilisateur.findUnique({ where: { email } });

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

      console.log("Utilisateur GitHub créé :", email);
    }
  } catch (error) {
    console.error("Erreur enregistrement GitHub :", error);
  }
}

// ➤ Récupération de tous les utilisateurs
export async function getAllUtilisateurs(req, res) {
  try {
    const utilisateurs = await prisma.utilisateur.findMany({
      include: {
        taches: true,
      },
    });

    const result = utilisateurs.map(user => {
      const tasksCount = user.taches.length;
      const completedTasks = user.taches.filter(t => t.statut === "terminé").length;

      return {
        id: user.id,
        nomUtilisateur: user.nomUtilisateur,
        email: user.email,
        role: user.role,
        tasksCount,
        completedTasks,
        joinDate: user.joinDate,
        isActive: user.isActive,
      };
    });

    res.json(result);
  } catch (error) {
    console.error("Erreur récupération utilisateurs :", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
}

// ➤ Mise à jour du rôle d'un utilisateur (admin only)
export async function updateUserRole(req, res) {
  const { id } = req.params;
  const { role } = req.body;

  if (!["administrateur", "utilisateur"].includes(role)) {
    return res.status(400).json({ error: "Rôle invalide." });
  }

  // Vérification du rôle de l'utilisateur connecté
  if (req.user.role !== 'administrateur') {
    return res.status(403).json({ error: 'Accès interdit' });
  }

  try {
    await prisma.utilisateur.update({
      where: { id },
      data: { role },
    });

    res.json({ message: "Rôle mis à jour avec succès." });
  } catch (error) {
    console.error("Erreur mise à jour rôle :", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
}

// ➤ Mise à jour du mot de passe
export async function updatePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user?.userId; // Assurer que l'utilisateur est connecté

  if (!userId) {
    return res.status(401).json({ error: "Utilisateur non authentifié." });
  }

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Les deux mots de passe sont nécessaires." });
  }

  try {
    // Récupérer l'utilisateur dans la base de données
    const user = await prisma.utilisateur.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    // Comparer l'ancien mot de passe avec celui stocké dans la base de données
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Ancien mot de passe incorrect." });
    }

    // Vérifier que le nouveau mot de passe est valide
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères." });
    }

    // Hacher le nouveau mot de passe avant de le sauvegarder
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe de l'utilisateur dans la base de données
    await prisma.utilisateur.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ message: "Mot de passe mis à jour avec succès." });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du mot de passe :", error);
    res.status(500).json({ error: "Erreur serveur lors de la mise à jour du mot de passe." });
  }
}

// ➤ Mise à jour du profil utilisateur
export const updateUserProfile = async (req, res) => {
  const { name, email } = req.body;

  // Vérifie que l'utilisateur est authentifié
  if (!req.user) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  // Validation des données
  if (!name || !email) {
    return res.status(400).json({ error: 'Nom et email sont requis' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Email invalide' });
  }

  if (!validateName(name)) {
    return res.status(400).json({ error: 'Nom invalide' });
  }

  try {
    // Mettre à jour les informations dans la base de données
    const updatedUser = await prisma.utilisateur.update({
      where: { id: req.user.id },  // Suppose que req.user.id contient l'ID de l'utilisateur authentifié
      data: {
        name,
        email
      }
    });

    // Répondre avec l'utilisateur mis à jour
    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil :', error);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};


  // ➤ Activation du compte
export async function activer(req, res) {
  const { id } = req.params;

  try {
    const utilisateur = await prisma.utilisateur.findUnique({ where: { id: Number(id) } });

    if (!utilisateur) {
      return res.status(404).json({ error: "Utilisateur introuvable." });
    }

    if (utilisateur.isActive) {
      return res.status(400).json({ message: "Ce compte est déjà activé." });
    }

    await prisma.utilisateur.update({
      where: { id: Number(id) },
      data: { isActive: true },
    });

    res.json({ message: "Votre compte a bien été activé. Vous pouvez maintenant vous connecter !" });
  } catch (error) {
    console.error("Erreur lors de l'activation du compte :", error);
    res.status(500).json({ error: "Une erreur est survenue pendant l'activation." });
  }
}
