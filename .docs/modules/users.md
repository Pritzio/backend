# 👥 Users Module - Pritzio Backend API

## 📋 **Overview**

The Users Module provides comprehensive user profile management, preferences, and activity tracking. It allows users to create detailed profiles, manage their preferences, and track their activity within the platform.

## 🚀 **Quick Start**

### **Prerequisites**
- Valid JWT token from authentication
- Appropriate user role and permissions
- API access configured

### **Base URL**
```
http://localhost:3000/api/v1/users
```

### **Authentication**
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 👤 **Profile Management**

### **Create User Profile**

Create a new profile for the authenticated user.

**Endpoint**: `POST /users/profile`

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-15",
  "gender": "male",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "USA",
  "website": "https://johndoe.com",
  "bio": "Software developer passionate about technology",
  "avatar": "https://example.com/avatar.jpg",
  "coverPhoto": "https://example.com/cover.jpg",
  "profileVisibility": "public"
}
```

**Response**:
```json
{
  "id": "uuid-here",
  "userId": "user-uuid",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-15",
  "gender": "male",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "USA",
  "website": "https://johndoe.com",
  "bio": "Software developer passionate about technology",
  "avatar": "https://example.com/avatar.jpg",
  "coverPhoto": "https://example.com/cover.jpg",
  "profileVisibility": "public",
  "isVerified": false,
  "isActive": true,
  "createdAt": "2025-08-21T10:00:00Z",
  "updatedAt": "2025-08-21T10:00:00Z"
}
```

### **Get Your Profile**

Retrieve your own profile information.

**Endpoint**: `GET /users/profile`

**Response**:
```json
{
  "id": "uuid-here",
  "userId": "user-uuid",
  "firstName": "John",
  "lastName": "Doe",
  "fullName": "John Doe",
  "displayName": "John Doe",
  "dateOfBirth": "1990-01-15",
  "age": 35,
  "gender": "male",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "USA",
  "location": "New York, NY, USA",
  "website": "https://johndoe.com",
  "bio": "Software developer passionate about technology",
  "avatar": "https://example.com/avatar.jpg",
  "coverPhoto": "https://example.com/cover.jpg",
  "profileVisibility": "public",
  "isVerified": false,
  "isActive": true,
  "createdAt": "2025-08-21T10:00:00Z",
  "updatedAt": "2025-08-21T10:00:00Z"
}
```

### **Get Another User's Profile**

Retrieve another user's profile (respects privacy settings).

**Endpoint**: `GET /users/profile/:userId`

**Parameters**:
- `userId`: The ID of the user whose profile you want to view

**Privacy Rules**:
- **Public**: Anyone can view
- **Friends**: Only friends can view (future implementation)
- **Private**: Only the user themselves can view

### **Update Your Profile**

Update your profile information.

**Endpoint**: `PUT /users/profile`

**Request Body**: Same as create profile, but all fields are optional
```json
{
  "firstName": "Johnny",
  "bio": "Updated bio information",
  "profileVisibility": "friends"
}
```

### **Delete Your Profile**

Delete your profile permanently.

**Endpoint**: `DELETE /users/profile`

**Response**: `204 No Content`

## ⚙️ **Preferences Management**

### **Create Preferences**

Set up your user preferences and settings.

**Endpoint**: `POST /users/preferences`

**Request Body**:
```json
{
  "language": "en",
  "currency": "USD",
  "timeZone": "UTC",
  "emailNotifications": true,
  "pushNotifications": true,
  "smsNotifications": false,
  "inAppNotifications": true,
  "marketingEmails": false,
  "priceAlerts": true,
  "storeUpdates": true,
  "securityAlerts": true,
  "darkMode": false,
  "dateFormat": "MM/DD/YYYY",
  "timeFormat": "12",
  "locationServices": true,
  "analyticsTracking": true,
  "socialFeatures": true
}
```

### **Get Your Preferences**

Retrieve your current preferences.

**Endpoint**: `GET /users/preferences`

**Response**: Same structure as create preferences request

### **Update Preferences**

Update your preferences (partial updates supported).

**Endpoint**: `PUT /users/preferences`

**Request Body**:
```json
{
  "darkMode": true,
  "language": "es",
  "emailNotifications": false
}
```

## 🔍 **User Search**

### **Search Users**

Search for other users by name or bio.

**Endpoint**: `GET /users/search`

**Query Parameters**:
- `q` (required): Search query (minimum 2 characters)
- `limit` (optional): Maximum results (default: 10, max: 50)

**Example**: `GET /users/search?q=john&limit=5`

**Response**:
```json
[
  {
    "id": "profile-uuid",
    "firstName": "John",
    "lastName": "Smith",
    "avatar": "https://example.com/avatar.jpg",
    "isVerified": true,
    "profileVisibility": "public"
  },
  {
    "id": "profile-uuid-2",
    "firstName": "Johnny",
    "lastName": "Doe",
    "avatar": "https://example.com/avatar2.jpg",
    "isVerified": false,
    "profileVisibility": "public"
  }
]
```

**Search Features**:
- Searches first name, last name, and bio
- Only returns public profiles
- Excludes your own profile
- Case-insensitive search
- Results ordered by relevance

## 📊 **Activity & Statistics**

### **Get Activity Log**

View your recent activity history.

**Endpoint**: `GET /users/activity`

**Query Parameters**:
- `limit` (optional): Maximum activities (default: 50, max: 100)

**Example**: `GET /users/activity?limit=20`

**Response**:
```json
[
  {
    "id": "activity-uuid",
    "userId": "user-uuid",
    "activityType": "profile_update",
    "activityLevel": "info",
    "description": "Profile updated",
    "details": "Updated bio and avatar",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "deviceId": "device-123",
    "location": "New York, NY",
    "isSuccessful": true,
    "createdAt": "2025-08-21T10:30:00Z"
  },
  {
    "id": "activity-uuid-2",
    "userId": "user-uuid",
    "activityType": "preferences_update",
    "activityLevel": "info",
    "description": "Preferences updated",
    "details": "Changed notification settings",
    "isSuccessful": true,
    "createdAt": "2025-08-21T10:15:00Z"
  }
]
```

### **Get Profile Statistics**

Get statistics about your profile and activity.

**Endpoint**: `GET /users/stats`

**Response**:
```json
{
  "profileCompleteness": 85,
  "lastActivity": "2025-08-21T10:30:00Z"
}
```

**Profile Completeness Calculation**:
- Based on 14 profile fields
- Percentage of filled vs. total fields
- Helps users understand profile completion status

## 🔧 **Administrative Endpoints (Admin Only)**

### **User Management**

#### **List All Users**
**Endpoint**: `GET /users/admin/users`

**Purpose**: Get a paginated list of all users with filtering options

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by user status (active, suspended, inactive)
- `role` (optional): Filter by user role (customer, admin, etc.)

**Example**: `GET /users/admin/users?page=1&limit=20&status=active&role=customer`

**Response**:
```json
{
  "users": [
    {
      "id": "user-uuid",
      "username": "john_doe",
      "email": "john@example.com",
      "status": "active",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "isVerified": true,
        "isActive": true,
        "profileVisibility": "public"
      },
      "roles": [
        {
          "id": "role-uuid",
          "name": "customer",
          "displayName": "Customer"
        }
      ],
      "createdAt": "2025-08-21T10:00:00Z",
      "lastLoginAt": "2025-08-21T15:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### **Get User Information**
**Endpoint**: `GET /users/admin/users/:userId`

**Purpose**: Get complete user information including profile, preferences, roles, and recent activity

**Parameters**: `userId` - User ID to get information for

**Response**:
```json
{
  "id": "user-uuid",
  "username": "john_doe",
  "email": "john@example.com",
  "status": "active",
  "type": "customer",
  "emailVerified": true,
  "phoneVerified": false,
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-05-15",
    "gender": "male",
    "phone": "+1234567890",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA",
    "website": "https://johndoe.com",
    "bio": "Software developer",
    "avatar": "https://example.com/avatar.jpg",
    "coverPhoto": "https://example.com/cover.jpg",
    "isVerified": true,
    "isActive": true,
    "profileVisibility": "public"
  },
  "preferences": {
    "language": "en",
    "currency": "USD",
    "timeZone": "EST",
    "emailNotifications": true,
    "pushNotifications": true
  },
  "roles": [
    {
      "id": "role-uuid",
      "name": "customer",
      "displayName": "Customer",
      "description": "Regular customer account",
      "permissions": [
        {
          "id": "perm-uuid",
          "name": "user_read",
          "displayName": "Read User Data",
          "category": "user_management"
        }
      ]
    }
  ],
  "recentActivity": [
    {
      "id": "activity-uuid",
      "activityType": "login",
      "description": "User logged in successfully",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2025-08-21T15:30:00Z"
    }
  ],
  "createdAt": "2025-08-21T10:00:00Z",
  "updatedAt": "2025-08-21T15:30:00Z",
  "lastLoginAt": "2025-08-21T15:30:00Z"
}
```

#### **Update User Status**
**Endpoint**: `PUT /users/admin/users/:userId/status`

**Purpose**: Update user account status (active, suspended, inactive)

**Parameters**: `userId` - User ID to update status for

**Request Body**:
```json
{
  "status": "suspended",
  "reason": "Violation of terms of service"
}
```

**Response**:
```json
{
  "message": "User status updated to suspended",
  "userId": "user-uuid",
  "status": "suspended"
}
```

**Available Statuses**:
- `active`: User can access the system normally
- `suspended`: User access is temporarily restricted
- `inactive`: User account is disabled
- `banned`: User is permanently banned

#### **Soft Delete User**
**Endpoint**: `DELETE /users/admin/users/:userId`

**Purpose**: Soft delete a user account (marks as deleted but preserves data)

**Parameters**: `userId` - User ID to delete

**Request Body**:
```json
{
  "reason": "User requested account deletion",
  "notes": "User was inactive for 6 months"
}
```

**Response**:
```json
{
  "message": "User account soft deleted successfully",
  "userId": "user-uuid",
  "deletedAt": "2025-08-21T15:30:00Z",
  "deletedBy": "admin_username",
  "canBeRestored": true
}
```

**Security Rules**:
- **SUPER_ADMIN**: Can delete anyone (including other SUPER_ADMINs)
- **ADMIN**: Can delete regular users but NOT SUPER_ADMINs or other ADMINs
- **Regular Users**: Cannot delete anyone

**⚠️ Note**: This is a soft delete - data is preserved and can be restored

#### **Restore Deleted User**
**Endpoint**: `POST /users/admin/users/:userId/restore`

**Purpose**: Restore a soft deleted user account

**Parameters**: `userId` - User ID to restore

**Query Parameters**:
- `reason` (optional): Reason for restoration

**Response**:
```json
{
  "message": "User account restored successfully",
  "userId": "user-uuid",
  "restoredAt": "2025-08-21T16:00:00Z",
  "restoredBy": "super_admin_username",
  "status": "active"
}
```

**Security**: Only SUPER_ADMIN can restore deleted users

### **Analytics & Reporting**

#### **Get User Analytics**
**Endpoint**: `GET /users/admin/analytics`

**Purpose**: Get comprehensive analytics and statistics about users

**Response**:
```json
{
  "overview": {
    "totalUsers": 150,
    "activeUsers": 120,
    "verifiedUsers": 95,
    "newUsersLast30Days": 25,
    "activePercentage": 80,
    "verifiedPercentage": 63
  },
  "activity": {
    "totalActivities": 1250,
    "recentActivities": 180,
    "averageActivitiesPerUser": 8
  },
  "profileCompleteness": {
    "0-25%": 15,
    "26-50%": 25,
    "51-75%": 45,
    "76-100%": 65
  },
  "trends": {
    "userGrowth": 25,
    "activityGrowth": 180
  }
}
```

**Analytics Include**:
- User growth trends (last 30 days)
- Profile completion distribution
- Activity statistics
- Verification rates
- User engagement metrics

## 🔧 **Field Specifications**

### **Profile Fields**

| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| `firstName` | String | No | 100 | User's first name |
| `lastName` | String | No | 100 | User's last name |
| `dateOfBirth` | Date | No | - | Date in YYYY-MM-DD format |
| `gender` | Enum | No | - | `male`, `female`, `other`, `prefer_not_to_say` |
| `phone` | String | No | 20 | Phone number with country code |
| `address` | String | No | 200 | Street address |
| `city` | String | No | 100 | City name |
| `state` | String | No | 100 | State or province |
| `zipCode` | String | No | 10 | Postal/ZIP code |
| `country` | String | No | 100 | Country name |
| `website` | URL | No | 200 | Personal website URL |
| `bio` | String | No | 500 | Personal biography |
| `avatar` | URL | No | 200 | Profile picture URL |
| `coverPhoto` | URL | No | 200 | Cover photo URL |
| `profileVisibility` | Enum | No | - | `public`, `friends`, `private` |

### **Preference Fields**

| Field | Type | Default | Options | Description |
|-------|------|---------|---------|-------------|
| `language` | Enum | `en` | `en`, `es`, `fr`, `de`, `pt` | Interface language |
| `currency` | Enum | `USD` | `USD`, `EUR`, `GBP`, `MXN`, `COP` | Preferred currency |
| `timeZone` | Enum | `UTC` | `UTC`, `EST`, `CST`, `MST`, `PST`, `GMT` | Time zone |
| `emailNotifications` | Boolean | `true` | - | Email notifications enabled |
| `pushNotifications` | Boolean | `true` | - | Push notifications enabled |
| `smsNotifications` | Boolean | `false` | - | SMS notifications enabled |
| `inAppNotifications` | Boolean | `true` | - | In-app notifications enabled |
| `marketingEmails` | Boolean | `true` | - | Marketing emails enabled |
| `priceAlerts` | Boolean | `true` | - | Price alert notifications |
| `storeUpdates` | Boolean | `true` | - | Store update notifications |
| `securityAlerts` | Boolean | `true` | - | Security alert notifications |
| `darkMode` | Boolean | `false` | - | Dark mode interface |
| `dateFormat` | String | `en` | - | Date format preference |
| `timeFormat` | String | `12` | `12`, `24` | Time format preference |
| `locationServices` | Boolean | `true` | - | Location services enabled |
| `analyticsTracking` | Boolean | `true` | - | Analytics tracking enabled |
| `socialFeatures` | Boolean | `true` | - | Social features enabled |

## 🛡️ **Security & Privacy**

### **Profile Visibility**

Control who can see your profile:

- **Public**: Anyone can view your profile
- **Friends**: Only friends can view (future feature)
- **Private**: Only you can view your profile

### **Data Privacy**

- Personal information is protected according to privacy settings
- Activity logs are private to each user
- Search results respect privacy settings
- Admin users have elevated access for moderation

### **Security Features**

- All endpoints require authentication
- Role-based access control
- Input validation and sanitization
- Activity logging for audit trails
- Rate limiting to prevent abuse

## 📱 **Usage Examples**

### **Complete Profile Setup**

1. **Create Profile**:
```bash
curl -X POST http://localhost:3000/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Software developer",
    "profileVisibility": "public"
  }'
```

2. **Set Preferences**:
```bash
curl -X POST http://localhost:3000/api/v1/users/preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "language": "en",
    "currency": "USD",
    "darkMode": false,
    "emailNotifications": true
  }'
```

3. **View Profile**:
```bash
curl -X GET http://localhost:3000/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Search and Connect**

1. **Search Users**:
```bash
curl -X GET "http://localhost:3000/api/v1/users/search?q=john&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

2. **View Another Profile**:
```bash
curl -X GET http://localhost:3000/api/v1/users/profile/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## ❌ **Error Handling**

### **Common Error Responses**

#### **400 Bad Request**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

#### **401 Unauthorized**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

#### **403 Forbidden**
```json
{
  "statusCode": 403,
  "message": "Profile is private",
  "error": "Forbidden"
}
```

#### **404 Not Found**
```json
{
  "statusCode": 404,
  "message": "User profile not found",
  "error": "Not Found"
}
```

#### **409 Conflict**
```json
{
  "statusCode": 409,
  "message": "User profile already exists",
  "error": "Conflict"
}
```

### **Validation Errors**

Field validation errors include specific details:
```json
{
  "statusCode": 400,
  "message": [
    "firstName must be longer than or equal to 2 characters",
    "email must be a valid email address"
  ],
  "error": "Bad Request"
}
```

## 🔗 **Related Documentation**

- [Authentication Guide](./authentication.md) - How to authenticate and get JWT tokens
- [Security Setup](../setup/security-setup.md) - Security features and configuration
- [Environment Configuration](../setup/environment-configuration.md) - Environment setup

## 🆘 **Support**

### **Common Issues**

#### **Profile Already Exists**
- **Problem**: Trying to create a profile when one already exists
- **Solution**: Use PUT /users/profile to update instead

#### **Profile Not Found**
- **Problem**: Trying to access a non-existent profile
- **Solution**: Ensure the user ID is correct and the profile exists

#### **Profile is Private**
- **Problem**: Trying to access a private profile
- **Solution**: Only the profile owner can view private profiles

#### **Search Query Too Short**
- **Problem**: Search query must be at least 2 characters
- **Solution**: Use a longer search term

### **Need Help?**

- Check the API documentation in Swagger: `http://localhost:3000/api/docs`
- Review the authentication documentation
- Verify your JWT token is valid and not expired

---

**Last Updated**: 2025-08-21  
**API Version**: 1.0.0  
**Status**: ✅ Ready for Use
