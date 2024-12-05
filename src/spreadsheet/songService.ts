import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function updateSongsFromSheet(sheetData: string[][]): Promise<number> {
  let updatedCount = 0;
  await prisma.$transaction(async (tx) => {
    // Prepare data for upsert
    const songsData = sheetData.map(row => ({
      id: validateAndParseInt(row[0], 'ID'),
      title: row[1] || '',
      version: row[3] || '',
      beSp: validateAndParseInt(row[6], 'BE SP'),
      bSp: validateAndParseInt(row[7], 'B SP'),
      dSp: validateAndParseInt(row[8], 'D SP'),
      eSp: validateAndParseInt(row[9], 'E SP'),
      cSp: validateAndParseInt(row[10], 'C SP'),
      bDp: validateAndParseInt(row[11], 'B DP'),
      dDp: validateAndParseInt(row[12], 'D DP'),
      eDp: validateAndParseInt(row[13], 'E DP'),
      cDp: validateAndParseInt(row[14], 'C DP'),
    }));

    // Upsert each song
    for (const songData of songsData) {
      await tx.song.upsert({
        where: { id: songData.id },
        update: songData,
        create: songData,
      });
      updatedCount++;
    }
  });

  return updatedCount;
}

export async function updateGimmickAndNotesCountFromSheet(sheetData: string[][]): Promise<number> {
  const gimmicksData = sheetData.map(row => ({
    songId: validateAndParseInt(row[0], 'ID'),
    chartType: row[2],
    hasSoflan: row[3] === '1',
    hasStop: row[4] === '1',
    hasShockArrow: row[5] === '1',
    notes: Number(row[6]) || 0,
    freeze: Number(row[7]) || 0,
    shockArrow: Number(row[8]) || 0,
  }));

  await prisma.$transaction([
    prisma.gimmickAndNotes.deleteMany({}),
    prisma.$executeRaw`ALTER SEQUENCE "GimmickAndNotes_id_seq" RESTART WITH 1`,
    ...gimmicksData.map(gimmicks =>
      prisma.gimmickAndNotes.create({ data: gimmicks })
    )
  ]);

  return gimmicksData.length
}

function validateAndParseInt(value: string, fieldName: string): number {
  const parsed = parseInt(value)
  if (isNaN(parsed)) {
    console.warn(`Invalid ${fieldName}: ${value}. Using 0 instead.`)
    return 0
  }
  return parsed
}