import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "melehoub@gmail.com";
  const password = "admin123";

  // Vérification si l'email existe déjà dans la base de données
  const existingUser = await prisma.utilisateur.findUnique({
    where: { email },y
  });

  if (existingUser) {
    console.log("Un administrateur avec cet email existe déjà.");
    return;
  }

  // Hachage du mot de passe
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const admin = await prisma.utilisateur.create({
      data: {
        nomUtilisateur: "administrateur1Brayann",
        email,
        password: hashedPassword,
        role: "administrateur",
        isActive: true,  // Activer l'utilisateur dès la création
      },
    });

    console.log("Administrateur créé :", admin);
  } catch (error) {
    console.error("Erreur lors de la création de l'administrateur :", error);
  }
}

main()
  .catch((e) => console.error("Erreur principale :", e))
  .finally(() => prisma.$disconnect());
