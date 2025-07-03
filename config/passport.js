import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github";
import dotenv from "dotenv";
import { saveGoogleUser, saveGitHubUser } from "../controllers/authController.js";
import { PrismaClient } from "@prisma/client";

dotenv.config();
const prisma = new PrismaClient();

// Fonction générique pour récupérer ou créer un utilisateur via email
const getUserByEmail = async (email) => {
  const user = await prisma.utilisateur.findUnique({ where: { email } });
  if (!user) {
    // Si l'utilisateur n'existe pas, tu peux ajouter un utilisateur par défaut ou retourner une erreur
    return null;
  }
  return user;
};

// ========== GOOGLE STRATEGY ==========
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Ajout / mise à jour en base via logique métier
        await saveGoogleUser(profile);

        // Récupération de l'utilisateur final pour session
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("Email non fourni par Google"));
        }

        const user = await getUserByEmail(email);
        if (!user) {
          return done(new Error("Utilisateur non trouvé"));
        }

        return done(null, user);
      } catch (error) {
        console.error("Erreur stratégie Google :", error);
        return done(error);
      }
    }
  )
);

// ========== GITHUB STRATEGY ==========
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL || "http://localhost:3000/api/auth/github/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Ajout / mise à jour en base via logique métier
        await saveGitHubUser(profile);

        // Récupération de l'utilisateur final pour session
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("Email non fourni par GitHub"));
        }

        const user = await getUserByEmail(email);
        if (!user) {
          return done(new Error("Utilisateur non trouvé"));
        }

        return done(null, user);
      } catch (error) {
        console.error("Erreur stratégie GitHub :", error);
        return done(error);
      }
    }
  )
);

// ========== SESSION HANDLING ==========
passport.serializeUser((user, done) => {
  done(null, user.id); // Stocker uniquement l'id dans la session
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.utilisateur.findUnique({ where: { id } });
    done(null, user); // Retourne l'objet utilisateur
  } catch (error) {
    console.error("Erreur lors de la désérialisation de l'utilisateur", error);
    done(error, null);
  }
});

export default passport;
