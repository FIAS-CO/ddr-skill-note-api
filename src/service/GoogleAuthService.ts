import { OAuth2Client } from 'google-auth-library';
import prisma from '../db';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface GoogleUserData {
    googleId: string;
    email?: string;
    name?: string;
}

export class GoogleAuthService {
    /**
     * Googleトークンを検証し、ユーザー情報を取得する
     */
    async verifyGoogleToken(token: string): Promise<GoogleUserData> {
        try {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            if (!payload || !payload.sub) {
                throw new Error('Invalid token payload');
            }

            return {
                googleId: payload.sub,
                email: payload.email,
                name: payload.name
            };
        } catch (error) {
            console.error('Google token verification error:', error);
            throw new Error('Failed to verify Google token');
        }
    }

    /**
     * 既存のプレイヤーアカウントとGoogleアカウントを紐づける
     */
    async connectGoogleToPlayer(playerId: string, googleData: GoogleUserData) {
        // プレイヤーの存在確認
        const player = await prisma.player.findUnique({
            where: { id: playerId }
        });

        if (!player) {
            throw new Error('Player not found');
        }

        // 既に他のプレイヤーと紐づいていないか確認
        const existingPlayer = await this.findPlayerByGoogleId(googleData.googleId);
        if (existingPlayer && existingPlayer.id !== playerId) {
            throw new Error('This Google account is already connected to another player');
        }

        // 既存の認証アカウントをチェック
        const existingAuth = await prisma.authAccount.findFirst({
            where: {
                playerId,
                provider: 'google'
            }
        });

        if (existingAuth) {
            // 既存の認証アカウントを更新
            return prisma.authAccount.update({
                where: { id: existingAuth.id },
                data: {
                    providerAccountId: googleData.googleId,
                    email: googleData.email
                },
                include: { player: true }
            }).then(auth => auth.player);
        }

        // 新しい認証アカウントを作成
        return prisma.authAccount.create({
            data: {
                playerId,
                provider: 'google',
                providerAccountId: googleData.googleId,
                email: googleData.email
            },
            include: { player: true }
        }).then(auth => auth.player);
    }

    /**
     * Google IDからプレイヤーを検索する
     */
    async findPlayerByGoogleId(googleId: string) {
        const authAccount = await prisma.authAccount.findUnique({
            where: {
                provider_providerAccountId: {
                    provider: 'google',
                    providerAccountId: googleId
                }
            },
            include: { player: true }
        });

        return authAccount?.player || null;
    }

    /**
    * プレイヤーとGoogleアカウントの紐づけを解除する
    */
    async unlinkGoogleFromPlayer(playerId: string) {
        try {
            // プレイヤーの存在確認
            const player = await prisma.player.findUnique({
                where: { id: playerId }
            });

            if (!player) {
                // プレイヤーが存在しない場合も成功として扱う
                return {
                    message: "User was already deleted or does not exist"
                };
            }

            // 認証アカウントを検索
            const authAccount = await prisma.authAccount.findFirst({
                where: {
                    playerId,
                    provider: 'google'
                }
            });

            if (!authAccount) {
                // 認証アカウントが存在しない場合も成功として扱う
                return {
                    message: "Google account was already unlinked or never linked"
                };
            }

            // 認証アカウントを削除
            await prisma.authAccount.delete({
                where: { id: authAccount.id }
            });

            return {
                message: "Google account unlinked successfully"
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * ユーザーの存在確認とGoogle連携状態を検証
     */
    async validateUser(userId: string) {
        try {
            // プレイヤーの存在確認
            const player = await prisma.player.findUnique({
                where: { id: userId }
            });

            if (!player) {
                return {
                    exists: false,
                    isGoogleLinked: false
                };
            }

            // Google連携状態の確認
            const googleAccount = await prisma.authAccount.findFirst({
                where: {
                    playerId: userId,
                    provider: 'google'
                }
            });

            return {
                exists: true,
                isGoogleLinked: !!googleAccount
            };
        } catch (error) {
            console.error('User validation error:', error);
            throw new Error('Failed to validate user');
        }
    }
}