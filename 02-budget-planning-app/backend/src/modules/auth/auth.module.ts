import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/current-user.decorator';
import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsString } from 'class-validator';
import * as bcrypt from 'bcrypt';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsNotEmpty()
  fullName: string;

  @IsOptional()
  @IsString()
  defaultCurrency?: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtModule) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        fullName: dto.fullName,
        defaultCurrency: dto.defaultCurrency || 'USD',
      },
    });

    const token = this.generateToken(user.id, user.email);
    return { user: { id: user.id, email: user.email, fullName: user.fullName }, token };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const token = this.generateToken(user.id, user.email);
    return { user: { id: user.id, email: user.email, fullName: user.fullName }, token };
  }

  async getCurrentUser(id: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: { id: true, email: true, fullName: true, defaultCurrency: true },
    });
  }

  private generateToken(userId: string, email: string): string {
    const jwtSecret = process.env.JWT_SECRET || 'fintrack_budget_planning_development_secret_key_32bytes_min';
    // Use jsonwebtoken directly or through JwtService
    const jwt = require('jsonwebtoken');
    return jwt.sign({ sub: userId, email }, jwtSecret, { expiresIn: '7d' });
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
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getCurrentUser(user.id);
  }
}

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fintrack_budget_planning_development_secret_key_32bytes_min',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtAuthGuard],
  exports: [AuthService, JwtModule, JwtAuthGuard],
})
export class AuthModule {}
