-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tache" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dateEcheance" DATETIME,
    "priorite" TEXT NOT NULL,
    "statut" TEXT NOT NULL,
    "estPrive" BOOLEAN NOT NULL DEFAULT false,
    "bloquee" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Tache_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Tache" ("dateEcheance", "description", "estPrive", "id", "priorite", "statut", "titre", "userId") SELECT "dateEcheance", "description", "estPrive", "id", "priorite", "statut", "titre", "userId" FROM "Tache";
DROP TABLE "Tache";
ALTER TABLE "new_Tache" RENAME TO "Tache";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
