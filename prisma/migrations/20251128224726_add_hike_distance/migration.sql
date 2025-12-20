/*
  Warnings:

  - You are about to drop the column `startDate` on the `Hike` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Hike` table without a default value. This is not possible if the table is not empty.
  - Added the required column `difficulty` to the `Hike` table without a default value. This is not possible if the table is not empty.
  - Made the column `guideId` on table `Hike` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('EASY', 'MODERATE', 'HARD');

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_hikeId_fkey";

-- DropForeignKey
ALTER TABLE "Hike" DROP CONSTRAINT "Hike_guideId_fkey";

-- AlterTable
ALTER TABLE "Guide" ADD COLUMN     "location" TEXT,
ALTER COLUMN "languages" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Hike" DROP COLUMN "startDate",
ADD COLUMN     "coverUrl" TEXT,
ADD COLUMN     "distance" TEXT,
ADD COLUMN     "duration" TEXT,
ADD COLUMN     "meetingTime" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "difficulty",
ADD COLUMN     "difficulty" "DifficultyLevel" NOT NULL,
ALTER COLUMN "guideId" SET NOT NULL;

-- AlterTable
ALTER TABLE "HikerProfile" ADD COLUMN     "emergencyContact" TEXT,
ADD COLUMN     "fitnessLevel" TEXT,
ADD COLUMN     "medicalInfo" TEXT,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "preferredDifficulty" TEXT[],
ALTER COLUMN "interests" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Hike" ADD CONSTRAINT "Hike_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_hikeId_fkey" FOREIGN KEY ("hikeId") REFERENCES "Hike"("id") ON DELETE CASCADE ON UPDATE CASCADE;
