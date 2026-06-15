ALTER TABLE "Car" ADD COLUMN "approvalStatus" TEXT NOT NULL DEFAULT 'pendente';
ALTER TABLE "Car" ADD COLUMN "approvalNote"   TEXT;

-- Viaturas já existentes ficam aprovadas automaticamente
UPDATE "Car" SET "approvalStatus" = 'aprovada';
