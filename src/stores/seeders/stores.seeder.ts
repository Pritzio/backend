import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store, StoreType, StoreStatus, StoreCategory } from '../entities/store.entity';
import { PhysicalLocation, LocationStatus } from '../entities/physical-location.entity';

@Injectable()
export class StoresSeeder {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(PhysicalLocation)
    private readonly locationRepository: Repository<PhysicalLocation>,
  ) {}

  async seed(): Promise<void> {
    const stores = await this.createStores();
    await this.createPhysicalLocations(stores);
  }

  private async createStores(): Promise<Store[]> {
    const storesData = [
      {
        name: 'Electronics World',
        description: 'Leading electronics retailer with best prices and latest technology',
        website: 'https://electronicsworld.com',
        logo: 'https://electronicsworld.com/logo.png',
        type: StoreType.HYBRID,
        status: StoreStatus.ACTIVE,
        category: StoreCategory.ELECTRONICS,
        phone: '+1-555-123-4567',
        email: 'contact@electronicsworld.com',
        country: 'United States',
        timezone: 'America/New_York',
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: 'system',
        metadata: {
          socialMedia: {
            facebook: 'electronicsworld',
            twitter: 'eworld',
            instagram: 'electronicsworld_official'
          },
          features: ['price_match', 'extended_warranty', 'free_shipping']
        },
        createdBy: 'system',
      },
      {
        name: 'Fashion Forward',
        description: 'Trendy clothing and accessories for all ages',
        website: 'https://fashionforward.com',
        logo: 'https://fashionforward.com/logo.png',
        type: StoreType.ONLINE,
        status: StoreStatus.ACTIVE,
        category: StoreCategory.CLOTHING,
        phone: '+1-555-234-5678',
        email: 'hello@fashionforward.com',
        country: 'United States',
        timezone: 'America/Los_Angeles',
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: 'system',
        metadata: {
          socialMedia: {
            instagram: 'fashionforward',
            pinterest: 'fashionforward',
            tiktok: 'fashionforward_official'
          },
          features: ['free_returns', 'size_guide', 'virtual_try_on']
        },
        createdBy: 'system',
      },
      {
        name: 'Home & Garden Plus',
        description: 'Everything you need for your home and garden',
        website: 'https://homegardenplus.com',
        logo: 'https://homegardenplus.com/logo.png',
        type: StoreType.PHYSICAL,
        status: StoreStatus.ACTIVE,
        category: StoreCategory.HOME_AND_GARDEN,
        phone: '+1-555-345-6789',
        email: 'info@homegardenplus.com',
        country: 'United States',
        timezone: 'America/Chicago',
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: 'system',
        metadata: {
          socialMedia: {
            facebook: 'homegardenplus',
            youtube: 'homegardenplus'
          },
          features: ['in_store_pickup', 'garden_consultation', 'workshop_events']
        },
        createdBy: 'system',
      },
      {
        name: 'Sports Central',
        description: 'Premium sports equipment and athletic wear',
        website: 'https://sportscentral.com',
        logo: 'https://sportscentral.com/logo.png',
        type: StoreType.HYBRID,
        status: StoreStatus.PENDING_VERIFICATION,
        category: StoreCategory.SPORTS,
        phone: '+1-555-456-7890',
        email: 'sales@sportscentral.com',
        country: 'United States',
        timezone: 'America/Denver',
        isVerified: false,
        metadata: {
          socialMedia: {
            instagram: 'sportscentral',
            twitter: 'sportscentral'
          },
          features: ['team_discounts', 'equipment_rental', 'sports_clinics']
        },
        createdBy: 'system',
      },
      {
        name: 'Beauty Haven',
        description: 'Luxury beauty products and skincare essentials',
        website: 'https://beautyhaven.com',
        logo: 'https://beautyhaven.com/logo.png',
        type: StoreType.ONLINE,
        status: StoreStatus.ACTIVE,
        category: StoreCategory.BEAUTY,
        phone: '+1-555-567-8901',
        email: 'beauty@beautyhaven.com',
        country: 'United States',
        timezone: 'America/New_York',
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: 'system',
        metadata: {
          socialMedia: {
            instagram: 'beautyhaven',
            youtube: 'beautyhaven_official',
            tiktok: 'beautyhaven'
          },
          features: ['beauty_consultation', 'sample_program', 'loyalty_rewards']
        },
        createdBy: 'system',
      },
    ];

    const stores: Store[] = [];
    
    for (const storeData of storesData) {
      const existingStore = await this.storeRepository.findOne({
        where: [
          { name: storeData.name },
          { website: storeData.website }
        ]
      });

      if (!existingStore) {
        const store = this.storeRepository.create(storeData);
        const savedStore = await this.storeRepository.save(store);
        stores.push(savedStore);
        console.log(`✅ Store created: ${storeData.name}`);
      } else {
        stores.push(existingStore);
        console.log(`ℹ️ Store already exists: ${storeData.name}`);
      }
    }

    return stores;
  }

  private async createPhysicalLocations(stores: Store[]): Promise<void> {
    const locationsData = [
      // Electronics World - Multiple locations
      {
        storeId: stores[0].id,
        address: '123 Tech Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'United States',
        latitude: 40.7128,
        longitude: -74.0060,
        phone: '+1-555-123-4567',
        hours: 'Mon-Fri: 9AM-9PM, Sat: 10AM-8PM, Sun: 11AM-6PM',
        status: LocationStatus.ACTIVE,
        notes: 'Flagship store in Manhattan',
        metadata: {
          parking: 'Street parking available',
          accessibility: 'Wheelchair accessible',
          services: ['repair_center', 'demo_station', 'expert_consultation']
        },
      },
      {
        storeId: stores[0].id,
        address: '456 Innovation Drive',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        country: 'United States',
        latitude: 37.7749,
        longitude: -122.4194,
        phone: '+1-555-123-4568',
        hours: 'Mon-Fri: 10AM-8PM, Sat: 10AM-6PM, Sun: 12PM-5PM',
        status: LocationStatus.ACTIVE,
        notes: 'Tech hub location',
        metadata: {
          parking: 'Garage parking available',
          accessibility: 'Wheelchair accessible',
          services: ['startup_discounts', 'tech_events', 'innovation_lab']
        },
      },
      // Home & Garden Plus - Physical store locations
      {
        storeId: stores[2].id,
        address: '789 Garden Lane',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        country: 'United States',
        latitude: 41.8781,
        longitude: -87.6298,
        phone: '+1-555-345-6789',
        hours: 'Mon-Sat: 8AM-8PM, Sun: 9AM-6PM',
        status: LocationStatus.ACTIVE,
        notes: 'Main store with garden center',
        metadata: {
          parking: 'Large parking lot',
          accessibility: 'Wheelchair accessible',
          services: ['garden_center', 'landscaping_services', 'workshop_space']
        },
      },
      {
        storeId: stores[2].id,
        address: '321 Home Street',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60602',
        country: 'United States',
        latitude: 41.8857,
        longitude: -87.6225,
        phone: '+1-555-345-6790',
        hours: 'Mon-Fri: 9AM-7PM, Sat: 9AM-6PM, Sun: 10AM-5PM',
        status: LocationStatus.ACTIVE,
        notes: 'Downtown location',
        metadata: {
          parking: 'Street parking',
          accessibility: 'Wheelchair accessible',
          services: ['home_decor', 'kitchen_essentials', 'design_consultation']
        },
      },
      // Sports Central - Physical locations
      {
        storeId: stores[3].id,
        address: '567 Athletic Avenue',
        city: 'Denver',
        state: 'CO',
        zipCode: '80201',
        country: 'United States',
        latitude: 39.7392,
        longitude: -104.9903,
        phone: '+1-555-456-7890',
        hours: 'Mon-Fri: 7AM-9PM, Sat: 8AM-8PM, Sun: 8AM-6PM',
        status: LocationStatus.ACTIVE,
        notes: 'Main sports complex location',
        metadata: {
          parking: 'Large parking lot',
          accessibility: 'Wheelchair accessible',
          services: ['indoor_courts', 'fitness_center', 'equipment_rental']
        },
      },
    ];

    for (const locationData of locationsData) {
      const existingLocation = await this.locationRepository.findOne({
        where: {
          storeId: locationData.storeId,
          address: locationData.address,
          city: locationData.city,
          state: locationData.state,
        }
      });

      if (!existingLocation) {
        const location = this.locationRepository.create(locationData);
        await this.locationRepository.save(location);
        console.log(`✅ Physical location created: ${locationData.address}, ${locationData.city}`);
      } else {
        console.log(`ℹ️ Physical location already exists: ${locationData.address}, ${locationData.city}`);
      }
    }
  }

  async clear(): Promise<void> {
    await this.locationRepository.delete({});
    await this.storeRepository.delete({});
    console.log('🗑️ All stores and locations cleared');
  }
}
