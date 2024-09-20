/*
  Warnings:

  - A unique constraint covering the columns `[songId,grade,category,chartType,spdp,flareRank]` on the table `Ranking` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Ranking_songId_grade_category_chartType_key";

-- CreateIndex
CREATE UNIQUE INDEX "Ranking_songId_grade_category_chartType_spdp_flareRank_key" ON "Ranking"("songId", "grade", "category", "chartType", "spdp", "flareRank");
