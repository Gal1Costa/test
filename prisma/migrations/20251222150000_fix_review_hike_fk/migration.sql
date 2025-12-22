-- Make Review.hikeId nullable and change FK to ON DELETE SET NULL

-- First, allow NULL values in the hikeId column
ALTER TABLE "Review"
ALTER COLUMN "hikeId" DROP NOT NULL;

-- Drop the existing foreign key constraint that uses ON DELETE RESTRICT
ALTER TABLE "Review"
DROP CONSTRAINT IF EXISTS "Review_hikeId_fkey";

-- Recreate the foreign key with ON DELETE SET NULL so reviews remain
-- when a hike is deleted, and only their hikeId is cleared.
ALTER TABLE "Review"
ADD CONSTRAINT "Review_hikeId_fkey"
FOREIGN KEY ("hikeId") REFERENCES "Hike"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

