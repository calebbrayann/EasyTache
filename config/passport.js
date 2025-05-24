import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import GitHubStrategy from "passport-github";

import dotenv from "dotenv";
dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log("Profil Google :", profile); // Voir si Google renvoie bien les infos
      return done(null, profile);
    }
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/api/auth/github/callbac",
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});
console.log("GOOGLE_CLIENT_ID :", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET :", process.env.GOOGLE_CLIENT_SECRET);
console.log("GITHUB_CLIENT_ID :", process.env.GITHUB_CLIENT_ID);
console.log("GITHUB_CLIENT_SECRET :", process.env.GITHUB_CLIENT_SECRET);

export default passport;
