import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { isEmail } from "validator";  // Pour vérifier la validité de l'email

dotenv.config();

export async function envoyerEmail(type, destinataire, options = {}) {
  const { EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("EMAIL_USER ou EMAIL_PASS manquant dans le .env");
  }

  // Validation de l'email
  if (!isEmail(destinataire)) {
    throw new Error("Adresse email du destinataire invalide");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  let subject = "";
  let text = "";
  let html = "";

  switch (type) {
    case "bienvenue": {
      const nom = options.nom || "";
      subject = "Bienvenue sur EasyTâche !";
      text = `Bienvenue ${nom},\n\nMerci de t’être inscrit sur EasyTâche, l’outil simple et puissant pour reprendre le contrôle de tes journées.\nOn est ravi de t’avoir avec nous. À bientôt !`;
      html = `
        <div style="font-family:sans-serif; line-height:1.6; color:#333;">
          <h2 style="color:#2c3e50;">Bienvenue ${nom}</h2>
          <p>Merci de t’être inscrit sur <strong>EasyTâche</strong>,</p>
          <p>l’outil simple et puissant pour reprendre le contrôle de tes journées.</p>
          <p>On est ravi de t’avoir avec nous.</p>
          <p style="margin-top:20px;">À bientôt,</p>
          <p><strong>L’équipe EasyTâche</strong></p>
        </div>
      `;
      break;
    }
    case "reset": {
      const { nom = "", lien = "#" } = options;
      subject = "Réinitialisation de ton mot de passe";
      text = `Bonjour ${nom},\n\nVoici ton lien de réinitialisation :\n${lien}\n\nCe lien est valable 30 minutes.`;
      html = `
        <div style="font-family:sans-serif; line-height:1.6;">
          <p>Bonjour ${nom},</p>
          <p>Tu as demandé à réinitialiser ton mot de passe.</p>
          <p><a href="${lien}" style="color:#1a73e8; text-decoration:none;">Clique ici pour réinitialiser ton mot de passe</a></p>
          <p>Ce lien est valide pendant <strong>30 minutes</strong>.</p>
        </div>
      `;
      break;
    }
    case "notificationAdmin": {
      const { nom = "", email = "" } = options;
      subject = "Nouvelle inscription sur EasyTâche";
      text = `Un nouvel utilisateur vient de s'inscrire.\nNom : ${nom}\nEmail : ${email}`;
      html = `
        <div style="font-family:sans-serif; line-height:1.6; color:#333;">
          <h2>Nouvelle inscription</h2>
          <p>Nom : ${nom}</p>
          <p>Email : ${email}</p>
        </div>
      `;
      break;
    }
    default:
      throw new Error(
        "Type d'e-mail non reconnu (attendu : 'bienvenue', 'reset' ou 'notificationAdmin')"
      );
  }

  try {
    const info = await transporter.sendMail({
      from: `"Support EasyTâche" <${EMAIL_USER}>`,
      to: destinataire,
      subject,
      text,
      html,
    });

    console.log(`[EMAIL] ${type} envoyé à ${destinataire} (ID: ${info.messageId})`);
  } catch (error) {
    console.error(`[EMAIL] Erreur ${type} :`, error.message);
    throw new Error(`Erreur lors de l'envoi de l'e-mail pour ${type}: ${error.message}`);
  }
}
