/*
  Warnings:

  - You are about to drop the column `modelId` on the `Car` table. All the data in the column will be lost.
  - You are about to drop the column `bodyType` on the `CarModel` table. All the data in the column will be lost.
  - You are about to drop the column `endYear` on the `CarModel` table. All the data in the column will be lost.
  - You are about to drop the column `startYear` on the `CarModel` table. All the data in the column will be lost.
  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "CarGeneration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "startYear" INTEGER NOT NULL,
    "endYear" INTEGER,
    "bodyType" TEXT,
    "image" TEXT,
    "modelId" TEXT NOT NULL,
    CONSTRAINT "CarGeneration_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "CarModel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EngineConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displacement" TEXT,
    "fuelType" TEXT NOT NULL,
    "horsepower" INTEGER,
    "torque" INTEGER,
    "transmission" TEXT,
    "drivetrain" TEXT,
    "generationId" TEXT NOT NULL,
    CONSTRAINT "EngineConfig_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "CarGeneration" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "torque" INTEGER,
    "color" TEXT,
    "purchaseDate" DATETIME,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" TEXT NOT NULL,
    "generationId" TEXT,
    "engineConfigId" TEXT,
    CONSTRAINT "Car_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Car_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "CarGeneration" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Car_engineConfigId_fkey" FOREIGN KEY ("engineConfigId") REFERENCES "EngineConfig" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Car" ("color", "createdAt", "description", "drivetrain", "engine", "fuelType", "horsepower", "id", "image", "isPublic", "mileage", "nickname", "ownerId", "purchaseDate", "transmission", "updatedAt", "year") SELECT "color", "createdAt", "description", "drivetrain", "engine", "fuelType", "horsepower", "id", "image", "isPublic", "mileage", "nickname", "ownerId", "purchaseDate", "transmission", "updatedAt", "year" FROM "Car";
DROP TABLE "Car";
ALTER TABLE "new_Car" RENAME TO "Car";
CREATE INDEX "Car_ownerId_idx" ON "Car"("ownerId");
CREATE INDEX "Car_generationId_idx" ON "Car"("generationId");
CREATE TABLE "new_CarModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "makeId" TEXT NOT NULL,
    CONSTRAINT "CarModel_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "CarMake" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CarModel" ("id", "makeId", "name", "slug") SELECT "id", "makeId", "name", "slug" FROM "CarModel";
DROP TABLE "CarModel";
ALTER TABLE "new_CarModel" RENAME TO "CarModel";
CREATE INDEX "CarModel_makeId_idx" ON "CarModel"("makeId");
CREATE UNIQUE INDEX "CarModel_makeId_slug_key" ON "CarModel"("makeId", "slug");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "bio" TEXT,
    "avatar" TEXT,
    "coverImage" TEXT,
    "location" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("avatar", "bio", "coverImage", "createdAt", "email", "id", "location", "name", "updatedAt", "username") SELECT "avatar", "bio", "coverImage", "createdAt", "email", "id", "location", "name", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "CarGeneration_modelId_idx" ON "CarGeneration"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "CarGeneration_modelId_name_key" ON "CarGeneration"("modelId", "name");

-- CreateIndex
CREATE INDEX "EngineConfig_generationId_idx" ON "EngineConfig"("generationId");
