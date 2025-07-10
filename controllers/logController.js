import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

export const getLogs = async (req, res) => {
  try {
    const logs = await prisma.log.findMany({
      orderBy: { timestamp: "desc" },
    })
    res.json(logs)
  } catch (error) {
    console.error("Erreur récupération des logs :", error)
    res.status(500).json({ error: "Erreur serveur" })
  }
}


export const enregistrerLog  = async (email, type) => {
  try {
    await prisma.log.create({
      data: {
        email,
        type, // "login", "logout", "delete", etc.
        timestamp: new Date(),
      },
    })
  } catch (error) {
    console.error("Erreur enregistrement log :", error)
  }
}
