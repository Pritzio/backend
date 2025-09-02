import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { UsersSeeder } from './seeders/users.seeder';
import { UserProfile } from './entities/user-profile.entity';
import { UserPreferences } from './entities/user-preferences.entity';
import { UserActivity } from './entities/user-activity.entity';
import {
  IsAdultConstraint,
  IsNotFutureDateConstraint,
  IsValidPhoneNumberConstraint,
  IsValidWebsiteConstraint,
} from './validators/business-rules.validator';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserProfile, UserPreferences, UserActivity]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersSeeder,
    IsAdultConstraint,
    IsNotFutureDateConstraint,
    IsValidPhoneNumberConstraint,
    IsValidWebsiteConstraint,
  ],
  exports: [UsersService, UsersSeeder],
})
export class UsersModule {}
