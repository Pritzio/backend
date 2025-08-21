import { Gender, ProfileVisibility } from '../entities/user-profile.entity';

export interface IUserProfile {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  website?: string;
  bio?: string;
  avatar?: string;
  coverPhoto?: string;
  profileVisibility: ProfileVisibility;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserProfileResponse extends IUserProfile {
  fullName?: string;
  displayName?: string;
  age?: number;
  location?: string;
}

export interface IUserProfileSummary {
  id: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isVerified: boolean;
  profileVisibility: ProfileVisibility;
}
