-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tache" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "dateEcheance" DATETIME NOT NULL,
    "priorite" TEXT NOT NULL DEFAULT 'medium',
    "utilisateurId" INTEGER NOT NULL,
    CONSTRAINT "Tache_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Tache" ("dateEcheance", "description", "id", "priorite", "titre", "utilisateurId") SELECT "dateEcheance", "description", "id", "priorite", "titre", "utilisateurId" FROM "Tache";
DROP TABLE "Tache";
ALTER TABLE "new_Tache" RENAME TO "Tache";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
