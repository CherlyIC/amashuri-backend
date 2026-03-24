/*
  Warnings:

  - The primary key for the `Combination` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Comparison` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Enquiry` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Favourite` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Fee` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Review` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `School` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `SchoolAdmin` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `SchoolResource` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[schoolId]` on the table `Combination` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Combination" DROP CONSTRAINT "Combination_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "Comparison" DROP CONSTRAINT "Comparison_userId_fkey";

-- DropForeignKey
ALTER TABLE "Enquiry" DROP CONSTRAINT "Enquiry_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "Enquiry" DROP CONSTRAINT "Enquiry_userId_fkey";

-- DropForeignKey
ALTER TABLE "Favourite" DROP CONSTRAINT "Favourite_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "Favourite" DROP CONSTRAINT "Favourite_userId_fkey";

-- DropForeignKey
ALTER TABLE "Fee" DROP CONSTRAINT "Fee_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_userId_fkey";

-- DropForeignKey
ALTER TABLE "SchoolAdmin" DROP CONSTRAINT "SchoolAdmin_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "SchoolAdmin" DROP CONSTRAINT "SchoolAdmin_userId_fkey";

-- DropForeignKey
ALTER TABLE "SchoolResource" DROP CONSTRAINT "SchoolResource_schoolId_fkey";

-- AlterTable
ALTER TABLE "Combination" DROP CONSTRAINT "Combination_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "schoolId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Combination_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Combination_id_seq";

-- AlterTable
ALTER TABLE "Comparison" DROP CONSTRAINT "Comparison_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Comparison_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Comparison_id_seq";

-- AlterTable
ALTER TABLE "Enquiry" DROP CONSTRAINT "Enquiry_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "schoolId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Enquiry_id_seq";

-- AlterTable
ALTER TABLE "Favourite" DROP CONSTRAINT "Favourite_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "schoolId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Favourite_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Favourite_id_seq";

-- AlterTable
ALTER TABLE "Fee" DROP CONSTRAINT "Fee_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "schoolId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Fee_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Fee_id_seq";

-- AlterTable
ALTER TABLE "Review" DROP CONSTRAINT "Review_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "schoolId" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Review_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Review_id_seq";

-- AlterTable
ALTER TABLE "School" DROP CONSTRAINT "School_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "School_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "School_id_seq";

-- AlterTable
ALTER TABLE "SchoolAdmin" DROP CONSTRAINT "SchoolAdmin_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "schoolId" SET DATA TYPE TEXT,
ADD CONSTRAINT "SchoolAdmin_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "SchoolAdmin_id_seq";

-- AlterTable
ALTER TABLE "SchoolResource" DROP CONSTRAINT "SchoolResource_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "schoolId" SET DATA TYPE TEXT,
ADD CONSTRAINT "SchoolResource_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "SchoolResource_id_seq";

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- CreateIndex
CREATE UNIQUE INDEX "Combination_schoolId_key" ON "Combination"("schoolId");

-- AddForeignKey
ALTER TABLE "Fee" ADD CONSTRAINT "Fee_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Combination" ADD CONSTRAINT "Combination_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolResource" ADD CONSTRAINT "SchoolResource_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favourite" ADD CONSTRAINT "Favourite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favourite" ADD CONSTRAINT "Favourite_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comparison" ADD CONSTRAINT "Comparison_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolAdmin" ADD CONSTRAINT "SchoolAdmin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolAdmin" ADD CONSTRAINT "SchoolAdmin_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
