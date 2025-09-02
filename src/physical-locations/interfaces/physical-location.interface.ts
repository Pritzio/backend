import {
  LocationStatus,
  LocationType,
} from '../entities/physical-location.entity';

export interface IPhysicalLocationResponse {
  id: string;
  storeId: string;
  storeName: string;
  name: string;
  description?: string;
  type: LocationType;
  status: LocationStatus;
  address: string;
  address2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  website?: string;
  businessHours?: Record<string, any>;
  isOpen24Hours: boolean;
  hasParking: boolean;
  hasWheelchairAccess: boolean;
  hasPublicTransport: boolean;
  amenities?: string[];
  services?: string[];
  physicalPrice?: number;
  currency: string;
  priceAdjustments?: Record<string, any>;
  maxCapacity?: number;
  currentCapacity?: number;
  operatingHours?: Record<string, any>;
  specialHours?: Array<any>;
  holidays?: Array<any>;
  metadata?: Record<string, any>;
  createdBy: string;
  creatorName: string;
  createdAt: Date;
  updatedAt: Date;

  // Virtual properties
  isActive: boolean;
  isOpen: boolean;
  coordinates: { lat: number; lng: number };
  fullAddress: string;
  shortAddress: string;
  hasSpecialHours: boolean;
  hasHolidays: boolean;
  hasPriceAdjustments: boolean;
  isAtCapacity: boolean;
  capacityPercentage: number;
  isLowCapacity: boolean;
  hasAmenities: boolean;
  hasServices: boolean;
}

export interface IPhysicalLocationSummary {
  id: string;
  storeId: string;
  storeName: string;
  name: string;
  type: LocationType;
  status: LocationStatus;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  isOpen: boolean;
  hasParking: boolean;
  hasWheelchairAccess: boolean;
  physicalPrice?: number;
  currency: string;
  distance?: number;
  estimatedTravelTime?: number;
}

export interface IPhysicalLocationFilter {
  search?: string;
  storeId?: string;
  type?: LocationType;
  status?: LocationStatus;
  city?: string;
  state?: string;
  country?: string;
  hasParking?: boolean;
  hasWheelchairAccess?: boolean;
  hasPublicTransport?: boolean;
  isOpen24Hours?: boolean;
  hasAmenities?: boolean;
  hasServices?: boolean;
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  minCapacity?: number;
  maxCapacity?: number;
  createdBy?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  latitude?: number;
  longitude?: number;
  radius?: number;
  includeOpenOnly?: boolean;
}

export interface IPhysicalLocationAnalytics {
  totalLocations: number;
  activeLocations: number;
  inactiveLocations: number;
  locationsByType: Record<LocationType, number>;
  locationsByStatus: Record<LocationStatus, number>;
  locationsByCountry: Record<string, number>;
  locationsByState: Record<string, number>;
  averageCapacity: number;
  locationsWithParking: number;
  locationsWithWheelchairAccess: number;
  locationsWithPublicTransport: number;
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
  openLocations: number;
  closedLocations: number;
  locationsNeedingAttention: number;
}

export interface IPhysicalLocationSearchResult {
  locations: IPhysicalLocationResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ILocationDistanceResult {
  location: IPhysicalLocationResponse;
  distance: number;
  estimatedTravelTime: number;
  isWithinRadius: boolean;
}

export interface INearbyLocationsResult {
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  locations: ILocationDistanceResult[];
  total: number;
  averageDistance: number;
  closestLocation?: ILocationDistanceResult;
  farthestLocation?: ILocationDistanceResult;
}

export interface ILocationPriceComparison {
  locationId: string;
  locationName: string;
  storeName: string;
  basePrice: number;
  adjustedPrice: number;
  adjustments: Array<{
    reason: string;
    adjustment: number;
    percentage: boolean;
  }>;
  finalPrice: number;
  savings: number;
  savingsPercentage: number;
}

export interface ILocationBusinessHours {
  locationId: string;
  locationName: string;
  todayHours?: {
    open: string;
    close: string;
    isOpen: boolean;
  };
  nextOpenDay?: {
    day: string;
    hours: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  isCurrentlyOpen: boolean;
  timeUntilOpen?: number;
  timeUntilClose?: number;
  specialHours?: Array<{
    date: string;
    open: string;
    close: string;
    isOpen: boolean;
    reason: string;
  }>;
  holidays?: Array<{
    date: string;
    name: string;
    isOpen: boolean;
    openHours?: string;
    closeHours?: string;
  }>;
}

export interface ILocationCapacityStatus {
  locationId: string;
  locationName: string;
  currentCapacity: number;
  maxCapacity: number;
  capacityPercentage: number;
  isAtCapacity: boolean;
  isLowCapacity: boolean;
  availableSpots: number;
  recommendedVisitTime?: string;
  busyHours?: string[];
  quietHours?: string[];
}

export interface ILocationAmenitiesInfo {
  locationId: string;
  locationName: string;
  amenities: string[];
  services: string[];
  hasParking: boolean;
  hasWheelchairAccess: boolean;
  hasPublicTransport: boolean;
  parkingInfo?: {
    type: string;
    cost?: number;
    availability: 'available' | 'limited' | 'full';
  };
  accessibilityInfo?: {
    wheelchairAccess: boolean;
    elevatorAccess: boolean;
    accessibleRestrooms: boolean;
    accessibleParking: boolean;
  };
  transportInfo?: {
    publicTransport: boolean;
    busRoutes?: string[];
    trainStations?: string[];
    bikeRacks: boolean;
  };
}
