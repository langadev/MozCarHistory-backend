-- CreateTable
CREATE TABLE "MaintenanceRecord" (
    "id" SERIAL NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "vin" TEXT,
    "brandModel" TEXT NOT NULL,
    "mileage" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "parts" TEXT,
    "mechanic" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workshopId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceRecord_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
