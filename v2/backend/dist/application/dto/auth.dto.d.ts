export declare class RegisterDto {
    username: string;
    email: string;
    password: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
export declare class AuthResponseDto {
    user: {
        id: string;
        username: string;
        email: string;
        level: number;
        avatarUrl?: string;
    };
    token: string;
}
export declare class TokenPayload {
    sub: string;
    username: string;
    email: string;
    iat?: number;
    exp?: number;
}
