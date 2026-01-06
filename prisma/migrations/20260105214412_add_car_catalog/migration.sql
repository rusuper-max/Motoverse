/*
  Warnings:

  - You are about to drop the column `make` on the `Car` table. All the data in the column will be lost.
  - You are about to drop the column `model` on the `Car` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "CarMake" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "country" TEXT,
    "logo" TEXT,
    "isPopular" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "CarModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "bodyType" TEXT,
    "makeId" TEXT NOT NULL,
    CONSTRAINT "CarModel_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "CarMake" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Car" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "nickname" TEXT,
    "description" TEXT,
    "image" TEXT,
    "mileage" INTEGER,
    "engine" TEXT,
    "transmission" TEXT,
    "drivetrain" TEXT,
    "fuelType" TEXT,
    "horsepower" INTEGER,
    "color" TEXT,
    "purchaseDate" DATETIME,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" TEXT NOT NULL,
    "modelId" TEXT,
    CONSTRAINT "Car_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Car_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "CarModel" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Car" ("color", "createdAt", "description", "engine", "horsepower", "id", "image", "isPublic", "mileage", "nickname", "ownerId", "purchaseDate", "transmission", "updatedAt", "year") SELECT "color", "createdAt", "description", "engine", "horsepower", "id", "image", "isPublic", "mileage", "nickname", "ownerId", "purchaseDate", "transmission", "updatedAt", "year" FROM "Car";
DROP TABLE "Car";
ALTER TABLE "new_Car" RENAME TO "Car";
CREATE INDEX "Car_ownerId_idx" ON "Car"("ownerId");
CREATE INDEX "Car_modelId_idx" ON "Car"("modelId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CarMake_name_key" ON "CarMake"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CarMake_slug_key" ON "CarMake"("slug");

-- CreateIndex
CREATE INDEX "CarModel_makeId_idx" ON "CarModel"("makeId");

-- CreateIndex
CREATE UNIQUE INDEX "CarModel_makeId_slug_key" ON "CarModel"("makeId", "slug");
