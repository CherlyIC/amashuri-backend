-- AlterTable
ALTER TABLE "User" ADD COLUMN     "totp_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totp_secret" TEXT;
