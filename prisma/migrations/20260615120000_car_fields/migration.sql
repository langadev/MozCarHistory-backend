-- Add separate brand and model columns (populate from existing brandModel)
ALTER TABLE "Car" ADD COLUMN "brand" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Car" ADD COLUMN "model" TEXT NOT NULL DEFAULT '';

UPDATE "Car" SET
  "brand" = CASE
    WHEN position(' ' in "brandModel") > 0 THEN split_part("brandModel", ' ', 1)
    ELSE "brandModel"
  END,
  "model" = CASE
    WHEN position(' ' in "brandModel") > 0 THEN trim(substring("brandModel" from position(' ' in "brandModel") + 1))
    ELSE ''
  END;

-- Drop old brandModel column
ALTER TABLE "Car" DROP COLUMN "brandModel";

-- Add new optional fields
ALTER TABLE "Car" ADD COLUMN "year"           INTEGER;
ALTER TABLE "Car" ADD COLUMN "color"          TEXT;
ALTER TABLE "Car" ADD COLUMN "fuelType"       TEXT;
ALTER TABLE "Car" ADD COLUMN "transmission"   TEXT;
ALTER TABLE "Car" ADD COLUMN "engineSize"     TEXT;
ALTER TABLE "Car" ADD COLUMN "bodyType"       TEXT;
ALTER TABLE "Car" ADD COLUMN "initialMileage" INTEGER;
