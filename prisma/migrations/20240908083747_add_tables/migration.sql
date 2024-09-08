-- CreateTable
CREATE TABLE "PlayerScore" (
    "id" SERIAL NOT NULL,
    "playerId" UUID NOT NULL,
    "songId" INTEGER NOT NULL,
    "chartType" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "flareRank" TEXT NOT NULL,
    "flareSkill" INTEGER NOT NULL,

    CONSTRAINT "PlayerScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Song" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "bpm" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "beSp" INTEGER NOT NULL DEFAULT 0,
    "bSp" INTEGER NOT NULL DEFAULT 0,
    "dSp" INTEGER NOT NULL DEFAULT 0,
    "eSp" INTEGER NOT NULL DEFAULT 0,
    "cSp" INTEGER NOT NULL DEFAULT 0,
    "bDp" INTEGER NOT NULL DEFAULT 0,
    "dDp" INTEGER NOT NULL DEFAULT 0,
    "eDp" INTEGER NOT NULL DEFAULT 0,
    "cDp" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ranking" (
    "id" SERIAL NOT NULL,
    "songId" INTEGER NOT NULL,
    "grade" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "chartType" TEXT NOT NULL,
    "overallPercentage" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Ranking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerScore_playerId_songId_chartType_key" ON "PlayerScore"("playerId", "songId", "chartType");

-- CreateIndex
CREATE UNIQUE INDEX "Ranking_songId_grade_category_chartType_key" ON "Ranking"("songId", "grade", "category", "chartType");

-- AddForeignKey
ALTER TABLE "PlayerScore" ADD CONSTRAINT "PlayerScore_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerScore" ADD CONSTRAINT "PlayerScore_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ranking" ADD CONSTRAINT "Ranking_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
