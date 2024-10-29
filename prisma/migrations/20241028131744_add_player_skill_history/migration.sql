-- CreateTable
CREATE TABLE "PlayerSkillHistory" (
    "id" SERIAL NOT NULL,
    "playerId" UUID NOT NULL,
    "totalFlareSkillSp" INTEGER NOT NULL,
    "totalFlareSkillDp" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerSkillHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerSkillHistory_playerId_recordedAt_idx" ON "PlayerSkillHistory"("playerId", "recordedAt");

-- AddForeignKey
ALTER TABLE "PlayerSkillHistory" ADD CONSTRAINT "PlayerSkillHistory_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
