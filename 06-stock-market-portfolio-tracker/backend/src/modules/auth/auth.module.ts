import { Module, Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { CurrentUser, AuthenticatedStockUser } from '../../common/current-user.decorator';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import * as bcrypt from 'bcrypt';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsNotEmpty()
  fullName: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('User already exists');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        fullName: dto.fullName,
      },
    });

    const token = this.generateToken(user);
    return {
      user: { id: user.id, email: user.email, fullName: user.fullName },
      token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid email or password');

    const token = this.generateToken(user);
    return {
      user: { id: user.id, email: user.email, fullName: user.fullName },
      token,
    };
  }

  async getMe(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true, fullName: true, createdAt: true },
    });
  }

  private generateToken(user: { id: string; email: string; fullName: string }): string {
    return this.jwtService.sign(
      { sub: user.id, email: user.email, fullName: user.fullName },
      {
        secret:
          process.env.JWT_SECRET || 'fintrack_stocks_super_secret_jwt_key_32_characters_minimum',
        expiresIn: '7d',
      },
    );
  }
}

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedStockUser) {
    return this.authService.getMe(user.id);
  }
}

@Module({
  imports: [
    JwtModule.register({
      secret:
        process.env.JWT_SECRET || 'fintrack_stocks_super_secret_jwt_key_32_characters_minimum',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtAuthGuard],
  exports: [AuthService, JwtModule, JwtAuthGuard],
})
export class AuthModule {}
