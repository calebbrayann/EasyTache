import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export async function envoyerEmail(destinataire, lienReset) {
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  await transport.sendMail({
    from: "no-reply@monapp.com",
    to: destinataire,
    subject: "Réinitialisation de votre mot de passe",
    text: `Cliquez sur le lien suivant pour réinitialiser votre mot de passe : ${lienReset}`,
  });
}




