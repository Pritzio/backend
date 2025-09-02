import { Injectable } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

@ValidatorConstraint({ name: 'isAdult', async: false })
@Injectable()
export class IsAdultConstraint implements ValidatorConstraintInterface {
  validate(dateOfBirth: string, args: ValidationArguments) {
    if (!dateOfBirth) return true; // Let @IsOptional handle this

    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age >= 13; // Minimum age requirement
  }

  defaultMessage(args: ValidationArguments) {
    return 'User must be at least 13 years old';
  }
}

@ValidatorConstraint({ name: 'isNotFutureDate', async: false })
@Injectable()
export class IsNotFutureDateConstraint implements ValidatorConstraintInterface {
  validate(dateOfBirth: string, args: ValidationArguments) {
    if (!dateOfBirth) return true;

    const birthDate = new Date(dateOfBirth);
    const today = new Date();

    return birthDate <= today;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Date of birth cannot be in the future';
  }
}

@ValidatorConstraint({ name: 'isValidPhoneNumber', async: false })
@Injectable()
export class IsValidPhoneNumberConstraint
  implements ValidatorConstraintInterface
{
  validate(phone: string, args: ValidationArguments) {
    if (!phone) return true;

    // Basic international phone number validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  defaultMessage(args: ValidationArguments) {
    return 'Phone number must be a valid international format';
  }
}

@ValidatorConstraint({ name: 'isValidWebsite', async: false })
@Injectable()
export class IsValidWebsiteConstraint implements ValidatorConstraintInterface {
  validate(website: string, args: ValidationArguments) {
    if (!website) return true;

    try {
      const url = new URL(website);
      return ['http:', 'https:'].includes(url.protocol);
    } catch {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return 'Website must be a valid HTTP or HTTPS URL';
  }
}

// Decorators
export function IsAdult(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsAdultConstraint,
    });
  };
}

export function IsNotFutureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNotFutureDateConstraint,
    });
  };
}

export function IsValidPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidPhoneNumberConstraint,
    });
  };
}

export function IsValidWebsite(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidWebsiteConstraint,
    });
  };
}
