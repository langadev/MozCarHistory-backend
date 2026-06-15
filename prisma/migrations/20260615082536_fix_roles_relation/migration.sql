/*
  Warnings:

  - You are about to drop the column `brandModel` on the `MaintenanceRecord` table. All the data in the column will be lost.
  - You are about to drop the column `plateNumber` on the `MaintenanceRecord` table. All the data in the column will be lost.
  - You are about to drop the column `vin` on the `MaintenanceRecord` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Role` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `carId` to the `MaintenanceRecord` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_roleId_key";

-- AlterTable
ALTER TABLE "MaintenanceRecord" DROP COLUMN "brandModel",
DROP COLUMN "plateNumber",
DROP COLUMN "vin",
ADD COLUMN     "carId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Car" (
    "id" SERIAL NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "vin" TEXT,
    "brandModel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" INTEGER,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Car_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Car_plateNumber_key" ON "Car"("plateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Car_vin_key" ON "Car"("vin");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
