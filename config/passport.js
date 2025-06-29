import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github";
import dotenv from "dotenv";

dotenv.config();

// GOOGLE STRATEGY
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        "http://localhost:3000/api/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log(" Profil Google :", profile);
      return done(null, profile);
    }
  )
);

// GITHUB STRATEGY
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL:
        process.env.GITHUB_CALLBACK_URL ||
        "http://localhost:3000/api/auth/github/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      console.log(" Profil GitHub :", profile);
      return done(null, profile);
    }
  )
);


//  SERIALIZE / DESERIALIZE 
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// DEBUG ENV 
console.log(" ENV VARS :");
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("GITHUB_CLIENT_ID:", process.env.GITHUB_CLIENT_ID);
console.log("FACEBOOK_CLIENT_ID:", process.env.FACEBOOK_CLIENT_ID);

export default passport;
