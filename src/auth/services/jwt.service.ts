import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
  roles: string[];
  permissions: string[];
  type: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class JwtService {
  constructor(
    private readonly jwtService: NestJwtService,
    private readonly configService: ConfigService,
  ) {}

  generateTokenPair(user: User): TokenPair {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      roles: user.roles?.map((role) => role.name) || [],
      permissions: this.extractPermissions(user),
      type: user.type,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
      issuer: this.configService.get<string>('JWT_ISSUER', 'pritzio-backend'),
      audience: this.configService.get<string>('JWT_AUDIENCE', 'pritzio-users'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret:
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      issuer: this.configService.get<string>('JWT_ISSUER', 'pritzio-backend'),
      audience: this.configService.get<string>('JWT_AUDIENCE', 'pritzio-users'),
    });

    const expiresIn = this.parseExpirationTime(
      this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    );

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  verifyToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
        issuer: this.configService.get<string>('JWT_ISSUER', 'pritzio-backend'),
        audience: this.configService.get<string>(
          'JWT_AUDIENCE',
          'pritzio-users',
        ),
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  verifyRefreshToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify(token, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          this.configService.get<string>('JWT_SECRET'),
        issuer: this.configService.get<string>('JWT_ISSUER', 'pritzio-backend'),
        audience: this.configService.get<string>(
          'JWT_AUDIENCE',
          'pritzio-users',
        ),
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  decodeToken(token: string): JwtPayload {
    return this.jwtService.decode(token);
  }

  private extractPermissions(user: User): string[] {
    const permissions = new Set<string>();

    if (user.roles) {
      user.roles.forEach((role) => {
        if (role.permissions) {
          role.permissions.forEach((permission) => {
            permissions.add(permission.name);
          });
        }
      });
    }

    return Array.from(permissions);
  }

  private parseExpirationTime(expiresIn: string): number {
    const timeUnits: { [key: string]: number } = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 900; // Default to 15 minutes
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    return value * timeUnits[unit];
  }
}
