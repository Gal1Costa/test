-- AlterTable: Add new fields to Guide
ALTER TABLE "Guide" ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;
ALTER TABLE "Guide" ADD COLUMN IF NOT EXISTS "displayName" TEXT;
ALTER TABLE "Guide" ADD COLUMN IF NOT EXISTS "languages" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Guide" ADD COLUMN IF NOT EXISTS "yearsExperience" INTEGER;
ALTER TABLE "Guide" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Guide" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3);
ALTER TABLE "Guide" ADD COLUMN IF NOT EXISTS "verifiedBy" TEXT;
ALTER TABLE "Guide" ADD COLUMN IF NOT EXISTS "profileSlug" TEXT;
ALTER TABLE "Guide" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Guide" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable: HikerProfile
CREATE TABLE IF NOT EXISTS "HikerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "displayName" TEXT,
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HikerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "HikerProfile_userId_key" ON "HikerProfile"("userId");

-- AddForeignKey (only if constraint doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'HikerProfile_userId_fkey'
    ) THEN
        ALTER TABLE "HikerProfile" ADD CONSTRAINT "HikerProfile_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

