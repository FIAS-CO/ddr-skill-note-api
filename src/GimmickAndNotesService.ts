import prisma from "./db"

interface GimmickAndNotes {
    hasSoflan: boolean;
    hasStop: boolean;
    hasShockArrow: boolean;
    notes: number;
    freeze: number;
    shockArrow: number;
}

export class GimmickAndNotesService {
    async getGimmickAndNotes(songId: number, chartType: string): Promise<GimmickAndNotes> {
        try {
            const data = await prisma.gimmickAndNotes.findFirst({
                where: {
                    songId: songId,
                    chartType: chartType[0]
                }
            });

            return {
                hasSoflan: data?.hasSoflan ?? false,
                hasStop: data?.hasStop ?? false,
                hasShockArrow: data?.hasShockArrow ?? false,
                notes: data?.notes ?? 0,
                freeze: data?.freeze ?? 0,
                shockArrow: data?.shockArrow ?? 0
            };
        } catch (error) {
            console.error('Error fetching gimmick and notes data:', error);
            throw error;
        }
    }
}