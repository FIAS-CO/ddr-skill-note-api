CREATE TABLE "GimmickAndNotes" (
    "id" SERIAL NOT NULL,
    "songId" INTEGER NOT NULL,
    "chartType" TEXT NOT NULL,
    "hasSoflan" BOOLEAN NOT NULL,
    "hasStop" BOOLEAN NOT NULL,
    "hasShockArrow" BOOLEAN NOT NULL,
    "notes" INTEGER NOT NULL,
    "freeze" INTEGER NOT NULL,
    "shockArrow" INTEGER NOT NULL,

    CONSTRAINT "GimmickAndNotes_pkey" PRIMARY KEY ("id")
);

