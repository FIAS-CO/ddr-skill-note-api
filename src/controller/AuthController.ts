import { Context } from 'hono';
import { GoogleAuthService } from '../service/GoogleAuthService';

export class AuthController {
    private googleAuthService: GoogleAuthService;

    constructor() {
        this.googleAuthService = new GoogleAuthService();
    }

    /**
     * 既存プレイヤーとGoogleアカウントを紐づける
     */
    async connectWithGoogle(c: Context) {
        try {
            const { playerId, googleToken } = await c.req.json();

            if (!playerId || !googleToken) {
                return c.json({ error: 'Player ID and Google token are required' }, 400);
            }

            const googleData = await this.googleAuthService.verifyGoogleToken(googleToken);
            const player = await this.googleAuthService.connectGoogleToPlayer(playerId, googleData);

            return c.json({
                success: true,
                player
            });
        } catch (error) {
            console.error('Google connect error:', error);
            return c.json({
                success: false,
                error: 'Failed to connect Google account',
                details: error instanceof Error ? error.message : 'Unknown error'
            }, 400);
        }
    }

    /**
     * Google認証を使ってプレイヤーを検索
     */
    async findPlayerByGoogle(c: Context) {
        try {
            const { googleToken } = await c.req.json();

            if (!googleToken) {
                return c.json({ error: 'Google token is required' }, 400);
            }

            const googleData = await this.googleAuthService.verifyGoogleToken(googleToken);
            const player = await this.googleAuthService.findPlayerByGoogleId(googleData.googleId);

            return c.json({
                success: true,
                found: !!player,
                player: player || undefined
            });
        } catch (error) {
            console.error('Find player by Google error:', error);
            return c.json({
                success: false,
                error: 'Authentication failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            }, 401);
        }
    }
}