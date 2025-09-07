import { AuthService } from '../../application/services/auth.service';
import { RegisterDto, LoginDto, AuthResponseDto } from '../../application/dto/auth.dto';
import { CurrentUserData } from '../decorators/current-user.decorator';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<AuthResponseDto>;
    login(dto: LoginDto): Promise<AuthResponseDto>;
    getProfile(user: CurrentUserData): Promise<{
        id: string;
        username: string;
        email: string;
    }>;
    refreshToken(user: CurrentUserData): Promise<{
        token: string;
    }>;
}
