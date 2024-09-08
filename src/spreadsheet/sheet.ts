import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import path from 'path';

const KEY_FILE_PATH = path.join(process.cwd(), 'service-account-key.json');

export async function getSheetData(spreadsheetId: string, range: string): Promise<string[][] | null> {
    try {
        const auth = new JWT({
            keyFile: KEY_FILE_PATH,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        return response.data.values || null;
    } catch (error) {
        console.error('Error fetching sheet data:', error);
        throw error;
    }
}