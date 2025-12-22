/*
  Warnings:

  - You are about to drop the column `mapLocation` on the `Hike` table. All the data in the column will be lost.
  - You are about to drop the column `route` on the `Hike` table. All the data in the column will be lost.
  - Added the required column `hikeId` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Hike" DROP COLUMN "mapLocation",
DROP COLUMN "route";

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "hikeId" TEXT NOT NULL,
ADD COLUMN     "tags" TEXT[];

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_hikeId_fkey" FOREIGN KEY ("hikeId") REFERENCES "Hike"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
