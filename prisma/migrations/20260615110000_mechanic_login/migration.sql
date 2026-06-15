-- Add mustChangePassword to User
ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- Add userId to Mechanic (links to the mechanic's own User account)
ALTER TABLE "Mechanic" ADD COLUMN "userId" INTEGER;
ALTER TABLE "Mechanic" ADD CONSTRAINT "Mechanic_userId_key" UNIQUE ("userId");
ALTER TABLE "Mechanic" ADD CONSTRAINT "Mechanic_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
