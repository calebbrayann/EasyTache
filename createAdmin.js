import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcryptjs';



const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.utilisateur.create({
    data: {
      nomUtilisateur: "administrateur1Brayann",
      email: "melehoub@gmail.com",
      password: hashedPassword,
      role: "administrateur",
    },
  });

  console.log("Administrateur créé :", admin);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
