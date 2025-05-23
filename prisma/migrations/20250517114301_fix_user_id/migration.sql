/*
  Warnings:

  - You are about to drop the column `utilisateurId` on the `Tache` table. All the data in the column will be lost.
  - You are about to drop the column `resetToken` on the `Utilisateur` table. All the data in the column will be lost.
  - You are about to drop the column `resetTokenExp` on the `Utilisateur` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `Utilisateur` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Tache` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `Tache` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tache" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dateEcheance" DATETIME NOT NULL,
    "priorite" TEXT NOT NULL DEFAULT 'medium',
    "statut" TEXT NOT NULL DEFAULT 'en cours',
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Tache_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Tache" ("dateEcheance", "description", "id", "priorite", "titre") SELECT "dateEcheance", "description", "id", "priorite", "titre" FROM "Tache";
DROP TABLE "Tache";
ALTER TABLE "new_Tache" RENAME TO "Tache";
CREATE TABLE "new_Utilisateur" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL
);
INSERT INTO "new_Utilisateur" ("email", "id", "password") SELECT "email", "id", "password" FROM "Utilisateur";
DROP TABLE "Utilisateur";
ALTER TABLE "new_Utilisateur" RENAME TO "Utilisateur";
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
