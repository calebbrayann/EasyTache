import express from "express";
import bodyParser from "body-parser";
import Routesauth from "./routes/Routesauth.js";
import nodemailer from "nodemailer";
import Routestaches from "./routes/Routestaches.js";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import dotenv from "dotenv";
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

import session from "express-session";
import passport from "./config/passport.js";

// Gestion des sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// Initialisation de Passport.js
app.use(passport.initialize());
app.use(passport.session());

// Ajout du middleware pour éviter les erreurs de `req.body undefined`
app.use(bodyParser.json());

// Vérification si Prisma se connecte bien
prisma
  .$connect()
  .then(() => {
    console.log("Prisma connecté avec succès.");
  })
  .catch((error) => {
    console.error("Erreur de connexion Prisma :", error);
  });

// 📌 Correction : Routes API correctement mappées
app.use("/api/auth", Routesauth);
app.use("/api/taches", Routestaches);

// Route de bienvenue
app.get("/", (req, res) => {
  res.send("Bienvenue sur mon API de gestion de tâches");
});

// Gestion des erreurs globales pour éviter les crashs
process.on("uncaughtException", (err) => {
  console.error("Erreur fatale :", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Promesse rejetée :", err);
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});

// Fermeture propre de Prisma
process.on("exit", async () => {
  await prisma.$disconnect();
  console.log("Prisma déconnecté proprement.");
});

process.on("uncaughtException", (err) => {
  console.error("Erreur critique :", err);
});

async function testSMTP() {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_SENDER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  try {
    await transporter.verify();
    console.log("Connexion SMTP réussie !");
  } catch (error) {
    console.error("Erreur de connexion SMTP :", error);
  }
}

testSMTP();
