import passport from "passport";
import { PrismaClient } from "@prisma/client";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";

const prisma = new PrismaClient();

// Stratégie Google OAuth
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      let utilisateur = await prisma.utilisateur.findUnique({
        where: { email: profile.emails[0].value },
      });
      if (!utilisateur) {
        utilisateur = await prisma.utilisateur.create({
          data: {
            email: profile.emails[0].value,
            nomUtilisateur: profile.displayName,
          },
        });
      }
      return done(null, utilisateur);
    }
  )
);

// Stratégie GitHub OAuth
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/auth/github/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      let utilisateur = await prisma.utilisateur.findUnique({
        where: { email: profile.emails[0].value },
      });
      if (!utilisateur) {
        utilisateur = await prisma.utilisateur.create({
          data: {
            email: profile.emails[0].value,
            nomUtilisateur: profile.username,
          },
        });
      }
      return done(null, utilisateur);
    }
  )
);

export default passport;
