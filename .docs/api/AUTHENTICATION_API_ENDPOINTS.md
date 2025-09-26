# 🔐 Authentication API - Endpoints Documentation

*This document provides comprehensive documentation for the Authentication API endpoints. The authentication system includes user registration, login, email verification, password management, and user profile management.*

*Last updated: 2025-01-27*
*API Version: 2.1*

## 📋 Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Endpoints](#endpoints)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Integration Examples](#integration-examples)

## 🎯 Overview

The Authentication API manages user authentication and authorization with the following features:

- **User Registration**: Complete user registration with validation
- **User Login**: Secure login with JWT tokens
- **Email Verification**: Email address verification system
- **Password Management**: Password reset and change functionality
- **Profile Management**: User profile updates and management
- **Role Management**: Role assignment and management
- **Token Management**: JWT token generation and refresh
- **Security Features**: Rate limiting, input validation, and security logging

## 🔐 Authentication

Most endpoints require JWT authentication:

```http
Authorization: Bearer <your-jwt-token>
```

### Required Roles

- **SUPER_ADMIN**: Full system access
- **ADMIN**: Administrative functions
- **STORE_ADMIN**: Store management
- **CUSTOMER**: Basic user access

## 🌐 Base URL

```
http://localhost:3000/api/v1/auth
```

## 🚀 Endpoints

### User Registration

#### Register New User

**POST** `/api/v1/auth/register`

Creates a new user account with complete validation and profile setup.

**Permissions**: No authentication required

**Request Body**:
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "type": "INDIVIDUAL",
  "acceptTermsAndConditions": true
}
```

**Response** (201 Created):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-user-id",
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "phone": "+1234567890",
    "status": "PENDING_VERIFICATION",
    "type": "INDIVIDUAL",
    "emailVerified": false,
    "phoneVerified": false,
    "isVerified": false,
    "avatar": null,
    "roles": [
      {
        "id": "role-uuid",
        "name": "CUSTOMER",
        "displayName": "Customer",
        "description": "Regular customer user",
        "priority": 100,
        "permissions": [
          {
            "id": "perm-uuid",
            "name": "USER_READ",
            "displayName": "Read Users",
            "description": "Can view user information",
            "category": "USER_MANAGEMENT",
            "priority": 90
          }
        ]
      }
    ],
    "permissions": ["USER_READ", "USER_UPDATE"],
    "createdAt": "2025-01-27T10:30:00.000Z",
    "updatedAt": "2025-01-27T10:30:00.000Z"
  }
}
```

**Error Response** (409 Conflict):
```json
{
  "statusCode": 409,
  "message": "User with this email or username already exists",
  "error": "Conflict"
}
```

### User Authentication

#### User Login

**POST** `/api/v1/auth/login`

Authenticates a user and returns JWT tokens.

**Permissions**: No authentication required

**Request Body**:
```json
{
  "identifier": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-user-id",
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "phone": "+1234567890",
    "status": "ACTIVE",
    "type": "INDIVIDUAL",
    "emailVerified": true,
    "phoneVerified": false,
    "isVerified": true,
    "avatar": "https://example.com/avatar.jpg",
    "roles": [
      {
        "id": "role-uuid",
        "name": "CUSTOMER",
        "displayName": "Customer",
        "description": "Regular customer user",
        "priority": 100,
        "permissions": []
      }
    ],
    "permissions": ["USER_READ", "USER_UPDATE"],
    "createdAt": "2025-01-27T10:30:00.000Z",
    "updatedAt": "2025-01-27T10:30:00.000Z"
  }
}
```

**Error Response** (401 Unauthorized):
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

#### Refresh Token

**POST** `/api/v1/auth/refresh`

Refreshes an expired access token using a valid refresh token.

**Permissions**: No authentication required

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-user-id",
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "status": "ACTIVE",
    "type": "INDIVIDUAL",
    "emailVerified": true,
    "phoneVerified": false,
    "isVerified": true,
    "roles": [],
    "permissions": [],
    "createdAt": "2025-01-27T10:30:00.000Z",
    "updatedAt": "2025-01-27T10:30:00.000Z"
  }
}
```

#### User Logout

**POST** `/api/v1/auth/logout`

Logs out the current user and invalidates their tokens.

**Permissions**: JWT authentication required

**Headers**:
```http
Authorization: Bearer <your-jwt-token>
```

**Response** (200 OK):
```json
{
  "message": "User successfully logged out"
}
```

### Password Management

#### Forgot Password

**POST** `/api/v1/auth/forgot-password`

Sends a password reset email to the user.

**Permissions**: No authentication required

**Request Body**:
```json
{
  "email": "john@example.com"
}
```

**Response** (200 OK):
```json
{
  "message": "Password reset email sent (if user exists)"
}
```

#### Reset Password

**POST** `/api/v1/auth/reset-password`

Resets user password using a valid reset token.

**Permissions**: No authentication required

**Request Body**:
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "message": "Password successfully reset"
}
```

#### Change Password

**PUT** `/api/v1/auth/change-password`

Changes user password (requires current password).

**Permissions**: JWT authentication required

**Headers**:
```http
Authorization: Bearer <your-jwt-token>
```

**Request Body**:
```json
{
  "currentPassword": "CurrentPass123!",
  "newPassword": "NewSecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "message": "Password successfully changed"
}
```

### Email Verification

#### Verify Email

**POST** `/api/v1/auth/verify-email`

Verifies user email address using verification token.

**Permissions**: No authentication required

**Request Body**:
```json
{
  "token": "email-verification-token"
}
```

**Response** (200 OK):
```json
{
  "message": "Email successfully verified"
}
```

**Error Response** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "Invalid verification token",
  "error": "Bad Request"
}
```

#### Verify Phone

**POST** `/api/v1/auth/verify-phone`

Verifies user phone number using verification code.

**Permissions**: No authentication required

**Request Body**:
```json
{
  "phone": "+1234567890",
  "code": "123456"
}
```

**Response** (200 OK):
```json
{
  "message": "Phone successfully verified"
}
```

### User Profile Management

#### Get User Profile

**GET** `/api/v1/auth/profile`

Gets the current user's profile information.

**Permissions**: JWT authentication required

**Headers**:
```http
Authorization: Bearer <your-jwt-token>
```

**Response** (200 OK):
```json
{
  "id": "uuid-user-id",
  "username": "johndoe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "fullName": "John Doe",
  "phone": "+1234567890",
  "status": "ACTIVE",
  "type": "INDIVIDUAL",
  "emailVerified": true,
  "phoneVerified": false,
  "isVerified": true,
  "avatar": "https://example.com/avatar.jpg",
  "roles": [
    {
      "id": "role-uuid",
      "name": "CUSTOMER",
      "displayName": "Customer",
      "description": "Regular customer user",
      "priority": 100,
      "permissions": []
    }
  ],
  "permissions": ["USER_READ", "USER_UPDATE"],
  "createdAt": "2025-01-27T10:30:00.000Z",
  "updatedAt": "2025-01-27T10:30:00.000Z"
}
```

#### Update User Profile

**PUT** `/api/v1/auth/profile`

Updates the current user's profile information.

**Permissions**: JWT authentication required

**Headers**:
```http
Authorization: Bearer <your-jwt-token>
```

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567890",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid-user-id",
  "username": "johndoe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Smith",
  "fullName": "John Smith",
  "phone": "+1234567890",
  "status": "ACTIVE",
  "type": "INDIVIDUAL",
  "emailVerified": true,
  "phoneVerified": false,
  "isVerified": true,
  "avatar": "https://example.com/new-avatar.jpg",
  "roles": [],
  "permissions": [],
  "createdAt": "2025-01-27T10:30:00.000Z",
  "updatedAt": "2025-01-27T11:30:00.000Z"
}
```

### Role Management (Admin Only)

#### Assign Role

**POST** `/api/v1/auth/assign-role`

Assigns a role to a user.

**Permissions**: SUPER_ADMIN, ADMIN

**Headers**:
```http
Authorization: Bearer <your-jwt-token>
```

**Request Body**:
```json
{
  "userId": "uuid-user-id",
  "roleId": "uuid-role-id"
}
```

**Response** (200 OK):
```json
{
  "message": "Role successfully assigned"
}
```

#### Remove Role

**DELETE** `/api/v1/auth/remove-role`

Removes a role from a user.

**Permissions**: SUPER_ADMIN, ADMIN

**Headers**:
```http
Authorization: Bearer <your-jwt-token>
```

**Request Body**:
```json
{
  "userId": "uuid-user-id",
  "roleId": "uuid-role-id"
}
```

**Response** (200 OK):
```json
{
  "message": "Role successfully removed"
}
```

#### Update User Status

**PUT** `/api/v1/auth/user-status`

Updates a user's status (Admin only).

**Permissions**: SUPER_ADMIN, ADMIN

**Headers**:
```http
Authorization: Bearer <your-jwt-token>
```

**Request Body**:
```json
{
  "userId": "uuid-user-id",
  "status": "ACTIVE"
}
```

**Response** (200 OK):
```json
{
  "message": "User status successfully updated"
}
```

### System Administration

#### Run Authentication Seeder

**POST** `/api/v1/auth/run-seeder`

Creates all roles and permissions in the system.

**Permissions**: No authentication required

**Response** (200 OK):
```json
{
  "message": "Authentication seeder completed successfully. All roles and permissions have been created."
}
```

#### Create Super Admin

**POST** `/api/v1/auth/create-super-admin`

Creates the first Super Admin user (only works if no SUPER_ADMIN exists).

**Permissions**: No authentication required

**Request Body**:
```json
{
  "email": "admin@pritzio.com",
  "username": "admin",
  "password": "SecureAdminPass123!",
  "firstName": "Super",
  "lastName": "Admin"
}
```

**Response** (201 Created):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-admin-id",
    "username": "admin",
    "email": "admin@pritzio.com",
    "firstName": "Super",
    "lastName": "Admin",
    "fullName": "Super Admin",
    "status": "ACTIVE",
    "type": "SYSTEM",
    "emailVerified": true,
    "phoneVerified": false,
    "isVerified": true,
    "roles": [
      {
        "id": "role-uuid",
        "name": "SUPER_ADMIN",
        "displayName": "Super Administrator",
        "description": "Full system access",
        "priority": 1000,
        "permissions": []
      }
    ],
    "permissions": ["*"],
    "createdAt": "2025-01-27T10:30:00.000Z",
    "updatedAt": "2025-01-27T10:30:00.000Z"
  },
  "expiresIn": 900
}
```

## 📊 Data Models

### RegisterDto
```typescript
interface RegisterDto {
  username: string;                    // 3-50 characters, unique
  email: string;                       // Valid email format, unique
  password: string;                    // 8-128 characters
  firstName: string;                   // 2-100 characters
  lastName: string;                    // 2-100 characters
  phone?: string;                      // Optional, max 20 characters
  type?: UserType;                     // Optional, defaults to INDIVIDUAL
  acceptTermsAndConditions: boolean;   // Required, must be true
}
```

### LoginDto
```typescript
interface LoginDto {
  identifier: string;                  // Email or username
  password: string;                    // User password
}
```

### CreateSuperAdminDto
```typescript
interface CreateSuperAdminDto {
  email: string;                       // Super Admin email
  username: string;                    // Super Admin username
  password: string;                    // Super Admin password
  firstName?: string;                  // Optional first name
  lastName?: string;                   // Optional last name
}
```

### AuthResponseDto
```typescript
interface AuthResponseDto {
  accessToken: string;                 // JWT access token
  refreshToken: string;                // JWT refresh token
  user: UserResponseDto;               // User information
  expiresIn?: number;                  // Token expiration in seconds
}
```

### UserResponseDto
```typescript
interface UserResponseDto {
  id: string;                          // User UUID
  username: string;                    // Username
  email: string;                       // Email address
  firstName: string;                   // First name
  lastName: string;                    // Last name
  fullName: string;                    // Full name (computed)
  phone?: string;                      // Phone number
  status: UserStatus;                  // User status
  type: UserType;                      // User type
  emailVerified: boolean;              // Email verification status
  phoneVerified: boolean;              // Phone verification status
  isVerified: boolean;                 // Overall verification status
  avatar?: string;                     // Avatar URL
  roles: RoleResponseDto[];            // User roles
  permissions: string[];               // User permissions
  createdAt: Date;                     // Creation timestamp
  updatedAt: Date;                     // Last update timestamp
}
```

### UserStatus Enum
```typescript
enum UserStatus {
  ACTIVE = 'active',                   // Active user
  INACTIVE = 'inactive',               // Inactive user
  PENDING_VERIFICATION = 'pending_verification', // Pending verification
  SUSPENDED = 'suspended',             // Suspended user
  BANNED = 'banned'                    // Banned user
}
```

### UserType Enum
```typescript
enum UserType {
  INDIVIDUAL = 'individual',           // Individual user
  BUSINESS = 'business',               // Business user
  SYSTEM = 'system'                    // System user
}
```

## ⚠️ Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

#### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

#### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

#### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

#### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "User with this email or username already exists",
  "error": "Conflict"
}
```

#### 422 Unprocessable Entity
```json
{
  "statusCode": 422,
  "message": [
    "username must be longer than or equal to 3 characters",
    "email must be a valid email",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Unprocessable Entity"
}
```

## 🚦 Rate Limiting

- **Registration**: 5 requests per 15 minutes per IP
- **Login**: 10 requests per 15 minutes per IP
- **Password Reset**: 3 requests per 15 minutes per IP
- **Other endpoints**: 100 requests per 15 minutes per IP

## 🔗 Integration Examples

### Frontend Integration (React/Next.js)

```typescript
// Authentication service
class AuthService {
  private baseURL = 'https://api.pritzio.com/api/v1/auth';
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  async register(userData: RegisterDto): Promise<AuthResponseDto> {
    const response = await fetch(`${this.baseURL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    this.setToken(data.accessToken);
    return data;
  }

  async login(credentials: LoginDto): Promise<AuthResponseDto> {
    const response = await fetch(`${this.baseURL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    this.setToken(data.accessToken);
    return data;
  }

  async getProfile(): Promise<UserResponseDto> {
    const response = await fetch(`${this.baseURL}/profile`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    return response.json();
  }

  async logout(): Promise<void> {
    await fetch(`${this.baseURL}/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });
    this.token = null;
  }
}
```

### Mobile App Integration (Flutter/Dart)

```dart
class AuthService {
  static const String baseURL = 'https://api.pritzio.com/api/v1/auth';
  String? _token;

  Future<AuthResponse> register(RegisterDto userData) async {
    final response = await http.post(
      Uri.parse('$baseURL/register'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(userData.toJson()),
    );

    if (response.statusCode == 201) {
      final data = json.decode(response.body);
      _token = data['accessToken'];
      return AuthResponse.fromJson(data);
    } else {
      throw Exception('Registration failed');
    }
  }

  Future<AuthResponse> login(LoginDto credentials) async {
    final response = await http.post(
      Uri.parse('$baseURL/login'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(credentials.toJson()),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      _token = data['accessToken'];
      return AuthResponse.fromJson(data);
    } else {
      throw Exception('Login failed');
    }
  }

  Future<UserResponse> getProfile() async {
    final response = await http.get(
      Uri.parse('$baseURL/profile'),
      headers: {
        'Authorization': 'Bearer $_token',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      return UserResponse.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to fetch profile');
    }
  }
}
```

### Third-party API Integration (Python)

```python
import requests
import json

class AuthAPI:
    def __init__(self, base_url):
        self.base_url = f"{base_url}/api/v1/auth"
        self.token = None

    def register(self, user_data):
        response = requests.post(
            f"{self.base_url}/register",
            json=user_data,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 201:
            data = response.json()
            self.token = data['accessToken']
            return data
        else:
            raise Exception(f"Registration failed: {response.text}")

    def login(self, credentials):
        response = requests.post(
            f"{self.base_url}/login",
            json=credentials,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            data = response.json()
            self.token = data['accessToken']
            return data
        else:
            raise Exception(f"Login failed: {response.text}")

    def get_profile(self):
        if not self.token:
            raise Exception("Not authenticated")
            
        response = requests.get(
            f"{self.base_url}/profile",
            headers={'Authorization': f'Bearer {self.token}'}
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Failed to fetch profile: {response.text}")
```

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- All IDs are UUIDs
- Passwords are hashed using bcrypt with 12 salt rounds
- JWT tokens expire in 15 minutes by default
- Refresh tokens are used to obtain new access tokens
- Email verification is required for full account activation
- Terms and conditions acceptance is mandatory for registration
- Rate limiting is applied to prevent abuse
- All sensitive operations are logged for security auditing

### Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Comprehensive validation on all inputs
- **Security Logging**: All operations are logged
- **Role-based Access**: Granular permission system
- **Email Verification**: Required for account activation
- **Password Reset**: Secure password reset flow

## 🔗 Related Documentation

- [User Management API](./USERS_API_ENDPOINTS.md) - User management endpoints
- [Role Management API](./ROLES_API_ENDPOINTS.md) - Role and permission management
- [Security Setup Guide](./SECURITY_SETUP.md) - Security configuration
- [Frontend Integration Guide](./FRONTEND_INTEGRATION_GUIDE.md) - Frontend integration examples
- [Mobile Integration Guide](./MOBILE_INTEGRATION_GUIDE.md) - Mobile app integration

---

*Última actualización: 27 de Enero, 2025*
