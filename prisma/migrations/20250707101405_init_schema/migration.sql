/*
  Warnings:

  - A unique constraint covering the columns `[resetToken]` on the table `Utilisateur` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `priorite` on the `Tache` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `statut` on the `Tache` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Priorite" AS ENUM ('basse', 'moyenne', 'haute');

-- CreateEnum
CREATE TYPE "Statut" AS ENUM ('en_cours', 'terminé', 'bloqué');

-- AlterTable
ALTER TABLE "Tache" DROP COLUMN "priorite",
ADD COLUMN     "priorite" "Priorite" NOT NULL,
DROP COLUMN "statut",
ADD COLUMN     "statut" "Statut" NOT NULL;

-- AlterTable
ALTER TABLE "Utilisateur" ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExp" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_resetToken_key" ON "Utilisateur"("resetToken");
