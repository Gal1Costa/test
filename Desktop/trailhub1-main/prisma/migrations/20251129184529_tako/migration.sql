/*
  Warnings:

  - You are about to drop the column `location` on the `Guide` table. All the data in the column will be lost.
  - You are about to drop the column `coverUrl` on the `Hike` table. All the data in the column will be lost.
  - You are about to drop the column `distance` on the `Hike` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `Hike` table. All the data in the column will be lost.
  - You are about to drop the column `gpxPath` on the `Hike` table. All the data in the column will be lost.
  - You are about to drop the column `meetingTime` on the `Hike` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Hike` table. All the data in the column will be lost.
  - The `difficulty` column on the `Hike` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `emergencyContact` on the `HikerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `fitnessLevel` on the `HikerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `medicalInfo` on the `HikerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `photoUrl` on the `HikerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `preferredDifficulty` on the `HikerProfile` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_hikeId_fkey";

-- DropForeignKey
ALTER TABLE "Hike" DROP CONSTRAINT "Hike_guideId_fkey";

-- AlterTable
ALTER TABLE "Guide" DROP COLUMN "location",
ALTER COLUMN "languages" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Hike" DROP COLUMN "coverUrl",
DROP COLUMN "distance",
DROP COLUMN "duration",
DROP COLUMN "gpxPath",
DROP COLUMN "meetingTime",
DROP COLUMN "updatedAt",
ADD COLUMN     "startDate" TIMESTAMP(3),
ALTER COLUMN "guideId" DROP NOT NULL,
DROP COLUMN "difficulty",
ADD COLUMN     "difficulty" TEXT;

-- AlterTable
ALTER TABLE "HikerProfile" DROP COLUMN "emergencyContact",
DROP COLUMN "fitnessLevel",
DROP COLUMN "medicalInfo",
DROP COLUMN "photoUrl",
DROP COLUMN "preferredDifficulty",
ALTER COLUMN "interests" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- DropEnum
DROP TYPE "DifficultyLevel";

-- AddForeignKey
ALTER TABLE "Hike" ADD CONSTRAINT "Hike_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_hikeId_fkey" FOREIGN KEY ("hikeId") REFERENCES "Hike"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
