-- AlterTable
ALTER TABLE "Hike" ADD COLUMN     "elevationGain" TEXT,
ADD COLUMN     "mapLocation" JSONB,
ADD COLUMN     "meetingPlace" TEXT,
ADD COLUMN     "route" JSONB,
ADD COLUMN     "routePath" TEXT,
ADD COLUMN     "whatToBring" TEXT;
