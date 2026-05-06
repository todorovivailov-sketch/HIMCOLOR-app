-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Recipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "validFrom" DATETIME NOT NULL,
    "baseOutputKg" DECIMAL NOT NULL DEFAULT 1000,
    "pailOutputKg" DECIMAL NOT NULL DEFAULT 1000,
    "containerOutputKg" DECIMAL NOT NULL DEFAULT 1000,
    "legacyOverheadRate" DECIMAL NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Recipe_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Recipe" ("baseOutputKg", "createdAt", "id", "note", "productId", "status", "updatedAt", "validFrom", "version") SELECT "baseOutputKg", "createdAt", "id", "note", "productId", "status", "updatedAt", "validFrom", "version" FROM "Recipe";
DROP TABLE "Recipe";
ALTER TABLE "new_Recipe" RENAME TO "Recipe";
CREATE INDEX "Recipe_productId_status_idx" ON "Recipe"("productId", "status");
CREATE UNIQUE INDEX "Recipe_productId_version_key" ON "Recipe"("productId", "version");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
