-- CreateTable
CREATE TABLE "Mechanic" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" TEXT,
    "phone" TEXT,
    "photo" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workshopId" INTEGER NOT NULL,

    CONSTRAINT "Mechanic_pkey" PRIMARY KEY ("id")
);

-- AlterTable: add mechanicId, drop mechanic string column
ALTER TABLE "MaintenanceRecord" ADD COLUMN "mechanicId" INTEGER;
ALTER TABLE "MaintenanceRecord" DROP COLUMN IF EXISTS "mechanic";

-- AddForeignKey for Mechanic -> User
ALTER TABLE "Mechanic" ADD CONSTRAINT "Mechanic_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey for MaintenanceRecord -> Mechanic
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_mechanicId_fkey" FOREIGN KEY ("mechanicId") REFERENCES "Mechanic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
