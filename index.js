import express from "express";
import bodyParser from "body-parser";
import Routesauth from "./routes/Routesauth.js";
import Routestaches from "./routes/Routestaches.js";
import adminRoutes from "./routes/adminRoutes.js";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import csrf from "csurf";
import session from "express-session";
import passport from "./config/passport.js";
import pkg from "@prisma/client";
import cors from "cors";
const { PrismaClient } = pkg;

dotenv.config();
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1)


// Middleware CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));

// Middleware BodyParser et CookieParser
app.use(bodyParser.json());
app.use(cookieParser());
app.use(helmet());

// Limitation des requêtes pour éviter les attaques par brute force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Trop de requêtes, réessayez plus tard.",
});
app.use(limiter);

// Middleware Session pour passport
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

// Middleware CSRF
const csrfProtection = csrf({ cookie: true });

// Exclusion des routes sensibles
app.use((req, res, next) => {
  if (req.path.startsWith("/api/auth") || req.is("application/json")) {
    return next();
  }
  csrfProtection(req, res, next);
});

// Initialisation de Passport pour l'authentification
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/auth", Routesauth);
app.use("/api/taches", Routestaches);
app.use("/api/administrateur", adminRoutes);

// Route pour exposer le token CSRF (utile pour le frontend)
app.get("/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Accueil
app.get("/", (req, res) => {
  res.send("Bienvenue sur mon API sécurisée de gestion de tâches !");
});

// Connexion à Prisma
prisma
  .$connect()
  .then(() => console.log("Prisma connecté"))
  .catch((error) => console.error("Erreur Prisma :", error));

// Test SMTP (vérification de la connexion)
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
    console.log("Connexion SMTP OK");
  } catch (error) {
    console.error("SMTP erreur :", error);
  }
}
testSMTP();

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});

// Déconnexion propre de Prisma à la fermeture
process.on("exit", async () => {
  await prisma.$disconnect();
  console.log("Prisma déconnecté proprement.");
});
