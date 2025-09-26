import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './controllers/auth.controller';
import { RolesController } from './controllers/roles.controller';
import { AuthService } from './services/auth.service';
import { RolesService } from './services/roles.service';
import { JwtService } from './services/jwt.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { AuthSeeder } from './seeds/auth.seeder';

import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { VerificationToken } from './entities/verification-token.entity';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../common/modules/email.module';
import { VerificationTokenService } from './services/verification-token.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Permission, VerificationToken]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    UsersModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
          issuer: configService.get<string>('JWT_ISSUER', 'pritzio-backend'),
          audience: configService.get<string>('JWT_AUDIENCE', 'pritzio-users'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, RolesController],
  providers: [
    AuthService,
    RolesService,
    JwtService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    AuthSeeder,
    VerificationTokenService,
  ],
  exports: [
    AuthService,
    RolesService,
    JwtService,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    TypeOrmModule,
    EmailModule,
  ],
})
export class AuthModule {}
