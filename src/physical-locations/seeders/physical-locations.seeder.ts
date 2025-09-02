import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PhysicalLocation,
  LocationType,
  LocationStatus,
} from '../entities/physical-location.entity';
import { Store } from '../../stores/entities/store.entity';
import { User } from '../../auth/entities/user.entity';
import { RoleType } from '../../auth/entities/role.entity';

@Injectable()
export class PhysicalLocationsSeeder {
  constructor(
    @InjectRepository(PhysicalLocation)
    private readonly physicalLocationRepository: Repository<PhysicalLocation>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed(): Promise<void> {
    const stores = await this.storeRepository.find();
    const users = await this.userRepository.find();

    if (stores.length === 0 || users.length === 0) {
      console.log(
        'Skipping physical locations seeding: No stores or users found',
      );
      return;
    }

    const adminUser =
      users.find((user) =>
        user.roles.some(
          (role) =>
            role.name === RoleType.SUPER_ADMIN || role.name === RoleType.ADMIN,
        ),
      ) || users[0];

    const sampleLocations = [
      {
        name: 'Downtown Store',
        description: 'Main store location in downtown area',
        type: LocationType.STORE,
        status: LocationStatus.ACTIVE,
        address: '123 Main Street',
        address2: 'Suite 100',
        city: 'New York',
        state: 'NY',
        country: 'United States',
        postalCode: '10001',
        latitude: 40.7128,
        longitude: -74.006,
        phone: '+1-555-123-4567',
        email: 'downtown@store.com',
        website: 'https://store.com/downtown',
        isOpen24Hours: false,
        hasParking: true,
        hasWheelchairAccess: true,
        hasPublicTransport: true,
        amenities: ['WiFi', 'Restroom', 'ATM', 'Coffee Bar'],
        services: ['Pickup', 'Delivery', 'Returns', 'Gift Wrapping'],
        physicalPrice: 999.99,
        currency: 'USD',
        maxCapacity: 100,
        currentCapacity: 45,
        operatingHours: {
          monday: { open: '09:00', close: '18:00', isOpen: true },
          tuesday: { open: '09:00', close: '18:00', isOpen: true },
          wednesday: { open: '09:00', close: '18:00', isOpen: true },
          thursday: { open: '09:00', close: '18:00', isOpen: true },
          friday: { open: '09:00', close: '20:00', isOpen: true },
          saturday: { open: '10:00', close: '17:00', isOpen: true },
          sunday: { open: '11:00', close: '16:00', isOpen: true },
        },
        specialHours: [
          {
            date: '2024-12-25',
            open: '10:00',
            close: '16:00',
            isOpen: true,
            reason: 'Christmas Day - Limited Hours',
          },
        ],
        holidays: [
          {
            date: '2024-12-25',
            name: 'Christmas Day',
            isOpen: false,
          },
          {
            date: '2024-01-01',
            name: "New Year's Day",
            isOpen: false,
          },
        ],
        priceAdjustments: {
          rush_hour: {
            reason: 'Rush hour surcharge (4-7 PM)',
            adjustment: 5,
            percentage: true,
            validFrom: new Date('2024-01-01'),
          },
          weekend: {
            reason: 'Weekend convenience fee',
            adjustment: 10,
            percentage: false,
            validFrom: new Date('2024-01-01'),
          },
        },
        metadata: {
          timezone: 'America/New_York',
          taxRate: 0.0875,
          parkingFee: 5.0,
        },
      },
      {
        name: 'Brooklyn Warehouse',
        description: 'Distribution center in Brooklyn',
        type: LocationType.WAREHOUSE,
        status: LocationStatus.ACTIVE,
        address: '456 Industrial Ave',
        city: 'Brooklyn',
        state: 'NY',
        country: 'United States',
        postalCode: '11201',
        latitude: 40.7182,
        longitude: -73.9584,
        phone: '+1-555-987-6543',
        email: 'warehouse@store.com',
        website: 'https://store.com/warehouse',
        isOpen24Hours: true,
        hasParking: true,
        hasWheelchairAccess: false,
        hasPublicTransport: true,
        amenities: ['Loading Dock', 'Security', 'Climate Control'],
        services: ['Bulk Orders', 'Wholesale', 'Export'],
        physicalPrice: 899.99,
        currency: 'USD',
        maxCapacity: 500,
        currentCapacity: 120,
        operatingHours: {
          monday: { open: '00:00', close: '23:59', isOpen: true },
          tuesday: { open: '00:00', close: '23:59', isOpen: true },
          wednesday: { open: '00:00', close: '23:59', isOpen: true },
          thursday: { open: '00:00', close: '23:59', isOpen: true },
          friday: { open: '00:00', close: '23:59', isOpen: true },
          saturday: { open: '00:00', close: '23:59', isOpen: true },
          sunday: { open: '00:00', close: '23:59', isOpen: true },
        },
        metadata: {
          timezone: 'America/New_York',
          taxRate: 0.0875,
          securityLevel: 'high',
        },
      },
      {
        name: 'Queens Pickup Point',
        description: 'Convenient pickup location in Queens',
        type: LocationType.PICKUP_POINT,
        status: LocationStatus.ACTIVE,
        address: '789 Queens Blvd',
        city: 'Queens',
        state: 'NY',
        country: 'United States',
        postalCode: '11375',
        latitude: 40.7282,
        longitude: -73.7949,
        phone: '+1-555-456-7890',
        email: 'queens@store.com',
        website: 'https://store.com/queens',
        isOpen24Hours: false,
        hasParking: false,
        hasWheelchairAccess: true,
        hasPublicTransport: true,
        amenities: ['Pickup Lockers', 'Customer Service'],
        services: ['Pickup', 'Returns', 'Exchanges'],
        physicalPrice: 1049.99,
        currency: 'USD',
        maxCapacity: 50,
        currentCapacity: 15,
        operatingHours: {
          monday: { open: '08:00', close: '20:00', isOpen: true },
          tuesday: { open: '08:00', close: '20:00', isOpen: true },
          wednesday: { open: '08:00', close: '20:00', isOpen: true },
          thursday: { open: '08:00', close: '20:00', isOpen: true },
          friday: { open: '08:00', close: '21:00', isOpen: true },
          saturday: { open: '09:00', close: '18:00', isOpen: true },
          sunday: { open: '10:00', close: '17:00', isOpen: true },
        },
        metadata: {
          timezone: 'America/New_York',
          taxRate: 0.0875,
          pickupTimeLimit: '7 days',
        },
      },
    ];

    for (const locationData of sampleLocations) {
      const store = stores[Math.floor(Math.random() * stores.length)];

      const existingLocation = await this.physicalLocationRepository.findOne({
        where: {
          storeId: store.id,
          name: locationData.name,
        },
      });

      if (!existingLocation) {
        const location = this.physicalLocationRepository.create({
          ...locationData,
          storeId: store.id,
          createdBy: adminUser.id,
        });

        await this.physicalLocationRepository.save(location);
        console.log(`Created physical location: ${location.name}`);
      }
    }

    console.log('Physical locations seeding completed');
  }
}
