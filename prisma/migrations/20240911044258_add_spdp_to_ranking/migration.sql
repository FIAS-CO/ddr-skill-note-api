/*
  Warnings:

  - Added the required column `spdp` to the `Ranking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Ranking" ADD COLUMN     "spdp" TEXT NOT NULL;
