import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { CurrentUser, AuthenticatedBankingUser } from '../../common/current-user.decorator';
import { IsEmail, IsNotEmpty, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole, KycStatus } from '@prisma/client';
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
  @IsEnum(UserRole)
  role?: UserRole;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new ConflictException('User with this email already exists');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const role = dto.role || UserRole.CUSTOMER;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        fullName: dto.fullName,
        role,
        ...(role === UserRole.CUSTOMER
          ? {
              customerProfile: {
                create: {
                  kycStatus: KycStatus.VERIFIED,
                  kycRecord: {
                    create: {
                      documentType: 'SIMULATED_ID',
                      documentNumber: `SIM-ID-${Math.floor(10000 + Math.random() * 90000)}`,
                      status: KycStatus.VERIFIED,
                    },
                  },
                },
              },
            }
          : {}),
      },
      include: { customerProfile: true, bankEmployee: true },
    });

    const token = this.generateToken(user);
    return {
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
      token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { customerProfile: true, bankEmployee: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isLocked) {
      throw new ForbiddenException('Account is locked due to repeated security failures');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      const attempts = user.failedAttempts + 1;
      const isLocked = attempts >= 5;
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedAttempts: attempts, isLocked },
      });
      await this.prisma.securityEvent.create({
        data: {
          userId: user.id,
          eventType: isLocked ? 'ACCOUNT_LOCKOUT' : 'LOGIN_FAILURE',
          details: { failedAttempts: attempts },
        },
      });
      throw new UnauthorizedException(
        isLocked ? 'Account locked after 5 failed attempts' : 'Invalid credentials',
      );
    }

    // Reset failed attempts on success
    if (user.failedAttempts > 0) {
      await this.prisma.user.update({ where: { id: user.id }, data: { failedAttempts: 0 } });
    }

    await this.prisma.securityEvent.create({
      data: { userId: user.id, eventType: 'LOGIN_SUCCESS' },
    });

    const token = this.generateToken(user);
    return {
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
      token,
    };
  }

  async getMe(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isMfaEnabled: true,
        customerProfile: { select: { id: true, kycStatus: true } },
        bankEmployee: { select: { employeeCode: true, department: true } },
      },
    });
  }

  private generateToken(user: any): string {
    const jwt = require('jsonwebtoken');
    const jwtSecret =
      process.env.JWT_SECRET || 'fintrack_banking_simulated_secret_key_32bytes_minimum';
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        customerProfileId: user.customerProfile?.id,
        employeeCode: user.bankEmployee?.employeeCode,
      },
      jwtSecret,
      { expiresIn: '1d' },
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
  me(@CurrentUser() user: AuthenticatedBankingUser) {
    return this.authService.getMe(user.id);
  }
}

@Module({
  imports: [
    JwtModule.register({
      secret:
        process.env.JWT_SECRET || 'fintrack_banking_simulated_secret_key_32bytes_minimum',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtAuthGuard, RolesGuard],
  exports: [AuthService, JwtModule, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
