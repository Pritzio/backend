# 🔐 Authentication API - Practical Examples

*This document provides practical examples and code snippets for implementing the Authentication API in various frontend frameworks and mobile applications.*

*Last updated: 2025-01-27*
*API Version: 2.1*

## 📋 Table of Contents

- [React/Next.js Examples](#reactnextjs-examples)
- [Vue.js Examples](#vuejs-examples)
- [Angular Examples](#angular-examples)
- [Mobile Examples](#mobile-examples)
- [Node.js Backend Examples](#nodejs-backend-examples)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## ⚛️ React/Next.js Examples

### Authentication Context

```typescript
// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  status: string;
  type: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  isVerified: boolean;
  avatar?: string;
  roles: Array<{
    id: string;
    name: string;
    displayName: string;
  }>;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  type?: string;
  acceptTermsAndConditions: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      setToken(storedToken);
      fetchUserProfile(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await fetch('/api/v1/auth/profile', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setToken(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to fetch user profile');
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      
      // Store tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      setToken(data.accessToken);
      setUser(data.user);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      
      // Store tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      setToken(data.accessToken);
      setUser(data.user);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear local state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      register,
      logout,
      loading,
      error,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### Login Component

```tsx
// components/LoginForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const LoginForm: React.FC = () => {
  const { login, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(formData.identifier, formData.password);
      // Redirect or show success message
    } catch (error) {
      // Error is handled by the context
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h2>Iniciar Sesión</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="identifier">Email o Usuario</label>
        <input
          type="text"
          id="identifier"
          name="identifier"
          value={formData.identifier}
          onChange={handleChange}
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Contraseña</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={loading}
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </button>
    </form>
  );
};
```

### Registration Component

```tsx
// components/RegisterForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const RegisterForm: React.FC = () => {
  const { register, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    type: 'INDIVIDUAL',
    acceptTermsAndConditions: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (!formData.acceptTermsAndConditions) {
      alert('Debes aceptar los términos y condiciones');
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      // Redirect or show success message
    } catch (error) {
      // Error is handled by the context
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="register-form">
      <h2>Crear Cuenta</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="firstName">Nombre</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="lastName">Apellido</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="username">Usuario</label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="phone">Teléfono (Opcional)</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="type">Tipo de Usuario</label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          disabled={loading}
        >
          <option value="INDIVIDUAL">Individual</option>
          <option value="BUSINESS">Empresa</option>
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="password">Contraseña</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirmar Contraseña</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            name="acceptTermsAndConditions"
            checked={formData.acceptTermsAndConditions}
            onChange={handleChange}
            disabled={loading}
            required
          />
          Acepto los términos y condiciones
        </label>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
      </button>
    </form>
  );
};
```

### Protected Route Component

```tsx
// components/ProtectedRoute.tsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check roles
  if (requiredRoles.length > 0) {
    const userRoles = user.roles.map(role => role.name);
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check permissions
  if (requiredPermissions.length > 0) {
    const hasRequiredPermission = requiredPermissions.some(permission => 
      user.permissions.includes(permission)
    );
    
    if (!hasRequiredPermission) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};
```

## 📱 Mobile Examples

### Flutter/Dart Implementation

```dart
// lib/services/auth_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class AuthService {
  static const String baseURL = 'https://api.pritzio.com/api/v1/auth';
  String? _token;

  Future<AuthResponse> login(String identifier, String password) async {
    final response = await http.post(
      Uri.parse('$baseURL/login'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'identifier': identifier,
        'password': password,
      }),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      _token = data['accessToken'];
      return AuthResponse.fromJson(data);
    } else {
      throw Exception('Login failed: ${response.body}');
    }
  }

  Future<AuthResponse> register(RegisterData userData) async {
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
      throw Exception('Registration failed: ${response.body}');
    }
  }

  Future<User> getProfile() async {
    if (_token == null) throw Exception('Not authenticated');

    final response = await http.get(
      Uri.parse('$baseURL/profile'),
      headers: {
        'Authorization': 'Bearer $_token',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      return User.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to fetch profile: ${response.body}');
    }
  }

  Future<void> logout() async {
    if (_token != null) {
      await http.post(
        Uri.parse('$baseURL/logout'),
        headers: {
          'Authorization': 'Bearer $_token',
          'Content-Type': 'application/json',
        },
      );
    }
    _token = null;
  }
}

class AuthResponse {
  final String accessToken;
  final String refreshToken;
  final User user;

  AuthResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      accessToken: json['accessToken'],
      refreshToken: json['refreshToken'],
      user: User.fromJson(json['user']),
    );
  }
}

class User {
  final String id;
  final String username;
  final String email;
  final String firstName;
  final String lastName;
  final String fullName;
  final String status;
  final String type;
  final bool emailVerified;
  final bool phoneVerified;
  final bool isVerified;
  final String? avatar;
  final List<Role> roles;
  final List<String> permissions;

  User({
    required this.id,
    required this.username,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.fullName,
    required this.status,
    required this.type,
    required this.emailVerified,
    required this.phoneVerified,
    required this.isVerified,
    this.avatar,
    required this.roles,
    required this.permissions,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      username: json['username'],
      email: json['email'],
      firstName: json['firstName'],
      lastName: json['lastName'],
      fullName: json['fullName'],
      status: json['status'],
      type: json['type'],
      emailVerified: json['emailVerified'],
      phoneVerified: json['phoneVerified'],
      isVerified: json['isVerified'],
      avatar: json['avatar'],
      roles: (json['roles'] as List)
          .map((role) => Role.fromJson(role))
          .toList(),
      permissions: List<String>.from(json['permissions']),
    );
  }
}

class Role {
  final String id;
  final String name;
  final String displayName;

  Role({
    required this.id,
    required this.name,
    required this.displayName,
  });

  factory Role.fromJson(Map<String, dynamic> json) {
    return Role(
      id: json['id'],
      name: json['name'],
      displayName: json['displayName'],
    );
  }
}

class RegisterData {
  final String username;
  final String email;
  final String password;
  final String firstName;
  final String lastName;
  final String? phone;
  final String type;
  final bool acceptTermsAndConditions;

  RegisterData({
    required this.username,
    required this.email,
    required this.password,
    required this.firstName,
    required this.lastName,
    this.phone,
    required this.type,
    required this.acceptTermsAndConditions,
  });

  Map<String, dynamic> toJson() {
    return {
      'username': username,
      'email': email,
      'password': password,
      'firstName': firstName,
      'lastName': lastName,
      'phone': phone,
      'type': type,
      'acceptTermsAndConditions': acceptTermsAndConditions,
    };
  }
}
```

## 🔧 Error Handling

### Global Error Handler

```typescript
// utils/errorHandler.ts
export class APIError extends Error {
  statusCode: number;
  error: string;

  constructor(message: string, statusCode: number, error: string) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.error = error;
  }
}

export const handleAPIError = (error: any): APIError => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    return new APIError(
      data.message || 'An error occurred',
      status,
      data.error || 'Unknown Error'
    );
  } else if (error.request) {
    // Network error
    return new APIError(
      'Network error. Please check your connection.',
      0,
      'Network Error'
    );
  } else {
    // Other error
    return new APIError(
      error.message || 'An unexpected error occurred',
      500,
      'Unknown Error'
    );
  }
};

export const getErrorMessage = (error: APIError): string => {
  switch (error.statusCode) {
    case 400:
      return 'Datos inválidos. Por favor verifica la información.';
    case 401:
      return 'Credenciales inválidas. Por favor verifica tu usuario y contraseña.';
    case 403:
      return 'No tienes permisos para realizar esta acción.';
    case 404:
      return 'Recurso no encontrado.';
    case 409:
      return 'El usuario ya existe. Por favor usa otro email o nombre de usuario.';
    case 422:
      return 'Error de validación. Por favor verifica los datos ingresados.';
    case 429:
      return 'Demasiados intentos. Por favor espera un momento.';
    case 500:
      return 'Error del servidor. Por favor intenta más tarde.';
    default:
      return error.message || 'Ha ocurrido un error inesperado.';
  }
};
```

## 🎯 Best Practices

### 1. Token Management

```typescript
// utils/tokenManager.ts
export class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'accessToken';
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken';

  static setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  static async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.setTokens(data.accessToken, data.refreshToken);
        return data.accessToken;
      } else {
        this.clearTokens();
        return null;
      }
    } catch (error) {
      this.clearTokens();
      return null;
    }
  }
}
```

### 2. API Client with Auto-Retry

```typescript
// utils/apiClient.ts
export class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`;
    const token = TokenManager.getAccessToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle token expiration
    if (response.status === 401 && token) {
      const newToken = await TokenManager.refreshAccessToken();
      if (newToken) {
        // Retry with new token
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, {
          ...options,
          headers,
        });
      }
    }

    return response;
  }

  async get(endpoint: string): Promise<any> {
    const response = await this.makeRequest(endpoint, { method: 'GET' });
    return this.handleResponse(response);
  }

  async post(endpoint: string, data?: any): Promise<any> {
    const response = await this.makeRequest(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse(response);
  }

  async put(endpoint: string, data?: any): Promise<any> {
    const response = await this.makeRequest(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse(response);
  }

  async delete(endpoint: string): Promise<any> {
    const response = await this.makeRequest(endpoint, { method: 'DELETE' });
    return this.handleResponse(response);
  }

  private async handleResponse(response: Response): Promise<any> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.message || 'Request failed',
        response.status,
        errorData.error || 'Unknown Error'
      );
    }

    return response.json();
  }
}
```

### 3. Form Validation

```typescript
// utils/validation.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): string[] => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }
  
  if (!/\d/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('La contraseña debe contener al menos un carácter especial');
  }
  
  return errors;
};

export const validateUsername = (username: string): string[] => {
  const errors: string[] = [];
  
  if (username.length < 3) {
    errors.push('El nombre de usuario debe tener al menos 3 caracteres');
  }
  
  if (username.length > 50) {
    errors.push('El nombre de usuario no puede tener más de 50 caracteres');
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('El nombre de usuario solo puede contener letras, números y guiones bajos');
  }
  
  return errors;
};
```

---

*Última actualización: 27 de Enero, 2025*
