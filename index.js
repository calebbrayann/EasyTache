import express from "express";
import bodyParser from "body-parser";
import Routesauth from "./routes/Routesauth.js";
import Routestaches from "./routes/Routestaches.js";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import csrf from "csurf";
import session from "express-session";
import passport from "./config/passport.js";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

dotenv.config();
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cookieParser());

app.use(helmet());

// Limite les requêtes (100 requêtes max / 15 min)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Trop de requêtes, réessayez plus tard.",
});
app.use(limiter);

//  Cookies + CSRF
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

//  Authentification
app.use(passport.initialize());
app.use(passport.session());

//  Lecture du JSON
app.use(bodyParser.json());

//  Prisma connecté ?
prisma
  .$connect()
  .then(() => console.log("Prisma connecté"))
  .catch((error) => console.error(" Erreur Prisma :", error));

//  Routes
app.use("/api/auth", Routesauth); //
app.use("/api/taches", csrfProtection, Routestaches);
//  Expose le token CSRF (utile pour le frontend)
app.get("/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

//  Page d’accueil
app.get("/", (req, res) => {
  res.send("Bienvenue sur mon API sécurisée de gestion de tâches !");
});

//  Test SMTP
async function testSMTP() {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.verify();
    console.log(" Connexion SMTP OK");
  } catch (error) {
    console.error(" SMTP erreur :", error);
  }
}
testSMTP();

//  Lancer serveur
app.listen(PORT, () => {
  console.log(` Serveur lancé sur http://localhost:${PORT}`);
});

//  Nettoyage Prisma
process.on("exit", async () => {
  await prisma.$disconnect();
  console.log(" Prisma déconnecté proprement.");
});
