# 🚀 Guía de Implementación Frontend - Registro y Activación de Cuentas

## 📋 **Índice**
1. [Resumen del Flujo](#resumen-del-flujo)
2. [Endpoints de la API](#endpoints-de-la-api)
3. [Implementación del Registro](#implementación-del-registro)
4. [Implementación de Verificación de Email](#implementación-de-verificación-de-email)
5. [Manejo de Estados](#manejo-de-estados)
6. [Componentes Recomendados](#componentes-recomendados)
7. [Ejemplos de Código](#ejemplos-de-código)
8. [Manejo de Errores](#manejo-de-errores)
9. [Testing](#testing)
10. [Consideraciones de UX](#consideraciones-de-ux)

---

## 🔄 **Resumen del Flujo**

### **Flujo Completo de Registro:**
```
1. Usuario llena formulario de registro
2. Frontend valida datos localmente
3. POST /api/v1/auth/register
4. Backend crea usuario y envía correos
5. Usuario recibe correo de bienvenida
6. Usuario recibe correo de verificación
7. Usuario hace clic en enlace de verificación
8. GET /api/v1/auth/verify-email/:token (automático)
9. Usuario activado y redirigido al dashboard
10. Si no recibe el correo: POST /api/v1/auth/resend-verification
```

---

## 🌐 **Endpoints de la API**

### **1. Registro de Usuario**
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "userType": "CUSTOMER",
  "acceptTermsAndConditions": true
}
```

**Respuesta Exitosa (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "userType": "CUSTOMER",
    "status": "PENDING_VERIFICATION",
    "emailVerified": false,
    "createdAt": "2025-09-26T21:00:00.000Z"
  }
}
```

**Errores Específicos (409):**
```json
// Username existente
{
  "message": "User with this username already exists",
  "error": "Conflict",
  "statusCode": 409
}

// Email existente
{
  "message": "User with this email already exists",
  "error": "Conflict",
  "statusCode": 409
}
```

### **2. Verificación de Username en Tiempo Real**
```http
POST /api/v1/auth/check-username
Content-Type: application/json

{
  "username": "testuser"
}
```

**Respuesta Exitosa (200):**
```json
{
  "exists": false,
  "message": "Username is available"
}
```

**Respuesta si existe (200):**
```json
{
  "exists": true,
  "message": "Username already exists"
}
```

### **3. Verificación de Email en Tiempo Real**
```http
POST /api/v1/auth/check-email
Content-Type: application/json

{
  "email": "test@example.com"
}
```

**Respuesta Exitosa (200):**
```json
{
  "exists": false,
  "message": "Email is available"
}
```

**Respuesta si existe (200):**
```json
{
  "exists": true,
  "message": "Email already exists"
}
```

### **4. Verificación de Email (POST)**
```http
POST /api/v1/auth/verify-email
Content-Type: application/json

{
  "token": "string"
}
```

**Respuesta Exitosa (200):**
```json
{
  "message": "Email successfully verified"
}
```

### **5. Verificación de Email (GET) - Desde URL**
```http
GET /api/v1/auth/verify-email/:token
```

**Respuesta Exitosa (200):**
```json
{
  "message": "Email successfully verified"
}
```

### **6. Reenvío de Verificación**
```http
POST /api/v1/auth/resend-verification
Content-Type: application/json

{
  "email": "string"
}
```

**Respuesta Exitosa (200):**
```json
{
  "message": "Verification email sent successfully"
}
```

**Errores (400/404):**
```json
// Email ya verificado
{
  "message": "Email already verified",
  "error": "Bad Request",
  "statusCode": 400
}

// Usuario no encontrado
{
  "message": "User not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

## 🎨 **Implementación del Registro**

### **1. Servicio de Validación en Tiempo Real**

```typescript
// validation.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  private readonly apiUrl = 'http://localhost:3000/api/v1/auth';

  constructor(private http: HttpClient) {}

  checkUsername(username: string): Observable<{ exists: boolean; message: string }> {
    if (!username || username.length < 3) {
      return of({ exists: false, message: 'Username is available' });
    }

    return this.http.post<{ exists: boolean; message: string }>(
      `${this.apiUrl}/check-username`,
      { username }
    ).pipe(
      catchError(() => of({ exists: false, message: 'Username is available' }))
    );
  }

  checkEmail(email: string): Observable<{ exists: boolean; message: string }> {
    if (!email || !this.isValidEmail(email)) {
      return of({ exists: false, message: 'Email is available' });
    }

    return this.http.post<{ exists: boolean; message: string }>(
      `${this.apiUrl}/check-email`,
      { email }
    ).pipe(
      catchError(() => of({ exists: false, message: 'Email is available' }))
    );
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
```

### **2. Componente de Registro con Validación en Tiempo Real**

```typescript
// registration.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { ValidationService } from '../services/validation.service';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
})
export class RegistrationComponent implements OnInit, OnDestroy {
  registrationForm: FormGroup;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  
  // Real-time validation states
  usernameChecking = false;
  emailChecking = false;
  usernameAvailable = false;
  emailAvailable = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private validationService: ValidationService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.setupRealTimeValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.registrationForm = this.fb.group({
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z0-9_]+$/)
      ]],
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(128),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      ]],
      confirmPassword: ['', [Validators.required]],
      firstName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
      ]],
      lastName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
      ]],
      phone: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(20),
        Validators.pattern(/^\+?[\d\s\-\(\)]+$/)
      ]],
      userType: ['CUSTOMER', [Validators.required]],
      acceptTermsAndConditions: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  private setupRealTimeValidation(): void {
    // Username validation
    this.registrationForm.get('username')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(username => {
          this.usernameChecking = true;
          return this.validationService.checkUsername(username);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(result => {
        this.usernameChecking = false;
        this.usernameAvailable = !result.exists;
        
        if (result.exists) {
          this.registrationForm.get('username')?.setErrors({ usernameExists: true });
        } else {
          const currentErrors = this.registrationForm.get('username')?.errors;
          if (currentErrors) {
            delete currentErrors['usernameExists'];
            this.registrationForm.get('username')?.setErrors(
              Object.keys(currentErrors).length > 0 ? currentErrors : null
            );
          }
        }
      });

    // Email validation
    this.registrationForm.get('email')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(email => {
          this.emailChecking = true;
          return this.validationService.checkEmail(email);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(result => {
        this.emailChecking = false;
        this.emailAvailable = !result.exists;
        
        if (result.exists) {
          this.registrationForm.get('email')?.setErrors({ emailExists: true });
        } else {
          const currentErrors = this.registrationForm.get('email')?.errors;
          if (currentErrors) {
            delete currentErrors['emailExists'];
            this.registrationForm.get('email')?.setErrors(
              Object.keys(currentErrors).length > 0 ? currentErrors : null
            );
          }
        }
      });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  onSubmit(): void {
    if (this.registrationForm.valid && !this.isLoading) {
      this.isLoading = true;
      
      const formData = this.registrationForm.value;
      delete formData.confirmPassword; // No enviar al backend
      
      this.authService.register(formData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.notificationService.showSuccess('¡Registro exitoso! Revisa tu correo para verificar tu cuenta.');
          
          // Redirigir a página de verificación
          this.router.navigate(['/auth/verify-email'], {
            queryParams: { email: formData.email }
          });
        },
        error: (error) => {
          this.isLoading = false;
          this.handleRegistrationError(error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private handleRegistrationError(error: any): void {
    if (error.status === 409) {
      // Ahora tenemos mensajes específicos del backend
      if (error.error.message.includes('username')) {
        this.registrationForm.get('username')?.setErrors({ usernameExists: true });
        this.notificationService.showError('Este nombre de usuario ya está en uso.');
      } else if (error.error.message.includes('email')) {
        this.registrationForm.get('email')?.setErrors({ emailExists: true });
        this.notificationService.showError('Este correo electrónico ya está registrado.');
      }
    } else if (error.status === 400) {
      this.notificationService.showError('Por favor, revisa los datos ingresados.');
    } else {
      this.notificationService.showError('Error al registrar. Inténtalo de nuevo.');
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registrationForm.controls).forEach(key => {
      const control = this.registrationForm.get(key);
      control?.markAsTouched();
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  getFieldError(fieldName: string): string {
    const field = this.registrationForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} es requerido.`;
      if (field.errors['email']) return 'Formato de correo inválido.';
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres.`;
      if (field.errors['maxlength']) return `${this.getFieldLabel(fieldName)} no puede exceder ${field.errors['maxlength'].requiredLength} caracteres.`;
      if (field.errors['pattern']) return this.getPatternError(fieldName);
      if (field.errors['passwordMismatch']) return 'Las contraseñas no coinciden.';
      if (field.errors['usernameExists']) return 'Este nombre de usuario ya está en uso.';
      if (field.errors['emailExists']) return 'Este correo electrónico ya está registrado.';
    }
    return '';
  }

  getFieldStatus(fieldName: string): 'checking' | 'available' | 'taken' | 'invalid' | 'neutral' {
    const field = this.registrationForm.get(fieldName);
    
    if (fieldName === 'username') {
      if (this.usernameChecking) return 'checking';
      if (field?.errors?.['usernameExists']) return 'taken';
      if (this.usernameAvailable && field?.valid) return 'available';
      if (field?.errors && field.touched) return 'invalid';
      return 'neutral';
    }
    
    if (fieldName === 'email') {
      if (this.emailChecking) return 'checking';
      if (field?.errors?.['emailExists']) return 'taken';
      if (this.emailAvailable && field?.valid) return 'available';
      if (field?.errors && field.touched) return 'invalid';
      return 'neutral';
    }
    
    return 'neutral';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      username: 'Nombre de usuario',
      email: 'Correo electrónico',
      password: 'Contraseña',
      confirmPassword: 'Confirmar contraseña',
      firstName: 'Nombre',
      lastName: 'Apellido',
      phone: 'Teléfono'
    };
    return labels[fieldName] || fieldName;
  }

  private getPatternError(fieldName: string): string {
    const patternErrors: { [key: string]: string } = {
      username: 'Solo se permiten letras, números y guiones bajos.',
      password: 'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un símbolo especial.',
      phone: 'Formato de teléfono inválido.'
    };
    return patternErrors[fieldName] || 'Formato inválido.';
  }
}
```

### **3. Template de Registro con Indicadores Visuales**

```html
<!-- registration.component.html -->
<div class="registration-container">
  <div class="registration-card">
    <div class="registration-header">
      <h1>Crear Cuenta</h1>
      <p>Únete a Pritzio y comienza a comparar precios</p>
    </div>

    <form [formGroup]="registrationForm" (ngSubmit)="onSubmit()" class="registration-form">
      <!-- Username con validación en tiempo real -->
      <div class="form-group">
        <label for="username">Nombre de Usuario *</label>
        <div class="input-with-status">
          <input
            type="text"
            id="username"
            formControlName="username"
            class="form-control"
            [class.is-invalid]="getFieldError('username')"
            [class.is-valid]="getFieldStatus('username') === 'available'"
            placeholder="Ingresa tu nombre de usuario"
          />
          <div class="input-status" [ngClass]="'status-' + getFieldStatus('username')">
            <i *ngIf="getFieldStatus('username') === 'checking'" class="fas fa-spinner fa-spin"></i>
            <i *ngIf="getFieldStatus('username') === 'available'" class="fas fa-check"></i>
            <i *ngIf="getFieldStatus('username') === 'taken'" class="fas fa-times"></i>
          </div>
        </div>
        <div class="invalid-feedback" *ngIf="getFieldError('username')">
          {{ getFieldError('username') }}
        </div>
        <div class="valid-feedback" *ngIf="getFieldStatus('username') === 'available'">
          ¡Nombre de usuario disponible!
        </div>
      </div>

      <!-- Email con validación en tiempo real -->
      <div class="form-group">
        <label for="email">Correo Electrónico *</label>
        <div class="input-with-status">
          <input
            type="email"
            id="email"
            formControlName="email"
            class="form-control"
            [class.is-invalid]="getFieldError('email')"
            [class.is-valid]="getFieldStatus('email') === 'available'"
            placeholder="tu@email.com"
          />
          <div class="input-status" [ngClass]="'status-' + getFieldStatus('email')">
            <i *ngIf="getFieldStatus('email') === 'checking'" class="fas fa-spinner fa-spin"></i>
            <i *ngIf="getFieldStatus('email') === 'available'" class="fas fa-check"></i>
            <i *ngIf="getFieldStatus('email') === 'taken'" class="fas fa-times"></i>
          </div>
        </div>
        <div class="invalid-feedback" *ngIf="getFieldError('email')">
          {{ getFieldError('email') }}
        </div>
        <div class="valid-feedback" *ngIf="getFieldStatus('email') === 'available'">
          ¡Correo electrónico disponible!
        </div>
      </div>

      <!-- Password -->
      <div class="form-group">
        <label for="password">Contraseña *</label>
        <div class="password-input">
          <input
            [type]="showPassword ? 'text' : 'password'"
            id="password"
            formControlName="password"
            class="form-control"
            [class.is-invalid]="getFieldError('password')"
            placeholder="Mínimo 8 caracteres"
          />
          <button
            type="button"
            class="password-toggle"
            (click)="togglePasswordVisibility()"
          >
            <i [class]="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
          </button>
        </div>
        <div class="invalid-feedback" *ngIf="getFieldError('password')">
          {{ getFieldError('password') }}
        </div>
      </div>

      <!-- Confirm Password -->
      <div class="form-group">
        <label for="confirmPassword">Confirmar Contraseña *</label>
        <div class="password-input">
          <input
            [type]="showConfirmPassword ? 'text' : 'password'"
            id="confirmPassword"
            formControlName="confirmPassword"
            class="form-control"
            [class.is-invalid]="getFieldError('confirmPassword')"
            placeholder="Confirma tu contraseña"
          />
          <button
            type="button"
            class="password-toggle"
            (click)="toggleConfirmPasswordVisibility()"
          >
            <i [class]="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
          </button>
        </div>
        <div class="invalid-feedback" *ngIf="getFieldError('confirmPassword')">
          {{ getFieldError('confirmPassword') }}
        </div>
      </div>

      <!-- First Name -->
      <div class="form-group">
        <label for="firstName">Nombre *</label>
        <input
          type="text"
          id="firstName"
          formControlName="firstName"
          class="form-control"
          [class.is-invalid]="getFieldError('firstName')"
          placeholder="Tu nombre"
        />
        <div class="invalid-feedback" *ngIf="getFieldError('firstName')">
          {{ getFieldError('firstName') }}
        </div>
      </div>

      <!-- Last Name -->
      <div class="form-group">
        <label for="lastName">Apellido *</label>
        <input
          type="text"
          id="lastName"
          formControlName="lastName"
          class="form-control"
          [class.is-invalid]="getFieldError('lastName')"
          placeholder="Tu apellido"
        />
        <div class="invalid-feedback" *ngIf="getFieldError('lastName')">
          {{ getFieldError('lastName') }}
        </div>
      </div>

      <!-- Phone -->
      <div class="form-group">
        <label for="phone">Teléfono *</label>
        <input
          type="tel"
          id="phone"
          formControlName="phone"
          class="form-control"
          [class.is-invalid]="getFieldError('phone')"
          placeholder="+1 (555) 123-4567"
        />
        <div class="invalid-feedback" *ngIf="getFieldError('phone')">
          {{ getFieldError('phone') }}
        </div>
      </div>

      <!-- Terms and Conditions -->
      <div class="form-group checkbox-group">
        <label class="checkbox-label">
          <input
            type="checkbox"
            formControlName="acceptTermsAndConditions"
            class="form-checkbox"
          />
          <span class="checkmark"></span>
          Acepto los <a href="/terms" target="_blank">Términos y Condiciones</a> y la <a href="/privacy" target="_blank">Política de Privacidad</a> *
        </label>
        <div class="invalid-feedback" *ngIf="getFieldError('acceptTermsAndConditions')">
          Debes aceptar los términos y condiciones.
        </div>
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        class="btn btn-primary btn-block"
        [disabled]="registrationForm.invalid || isLoading"
      >
        <span *ngIf="isLoading" class="spinner"></span>
        {{ isLoading ? 'Creando cuenta...' : 'Crear Cuenta' }}
      </button>
    </form>

    <div class="registration-footer">
      <p>¿Ya tienes cuenta? <a routerLink="/auth/login">Inicia sesión</a></p>
    </div>
  </div>
</div>
```

---

## ✨ **Nuevas Funcionalidades Implementadas**

### **🎯 Validación en Tiempo Real**
- **Verificación instantánea** de username y email
- **Indicadores visuales** (spinner, check, X)
- **Debounce** de 500ms para optimizar performance
- **Feedback inmediato** al usuario

### **🔧 Mensajes de Error Específicos**
- **Username existente:** `"User with this username already exists"`
- **Email existente:** `"User with this email already exists"`
- **Separación clara** entre errores de username y email

### **📡 Nuevos Endpoints de Verificación**
- **`POST /api/v1/auth/check-username`** - Verificar disponibilidad de username
- **`POST /api/v1/auth/check-email`** - Verificar disponibilidad de email
- **`GET /api/v1/auth/verify-email/:token`** - Verificación automática desde URL
- **`POST /api/v1/auth/resend-verification`** - Reenviar correo de verificación

### **🎨 Mejoras de UX**
- **Estados visuales** claros para cada campo
- **Mensajes de éxito** cuando los campos están disponibles
- **Validación progresiva** sin interrumpir la experiencia del usuario

---

## 🔐 **Implementación de Verificación de Email**

### **📧 Flujo de Verificación de Email:**

#### **1. Verificación Automática (Recomendada):**
- **Usuario hace clic** en el enlace del email
- **Backend verifica** automáticamente con `GET /api/v1/auth/verify-email/:token`
- **Usuario redirigido** al dashboard

#### **2. Verificación Manual:**
- **Frontend extrae** el token de la URL
- **Frontend llama** a `POST /api/v1/auth/verify-email`
- **Usuario redirigido** al dashboard

#### **3. Reenvío de Verificación:**
- **Usuario no recibe** el correo de verificación
- **Frontend llama** a `POST /api/v1/auth/resend-verification`
- **Nuevo correo** enviado con token fresco

---

## 🔐 **Implementación de Verificación de Email**

### **1. Componente de Verificación**

```typescript
// verify-email.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit {
  email: string = '';
  token: string = '';
  isVerifying = false;
  isResending = false;
  verificationStatus: 'pending' | 'success' | 'error' = 'pending';
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      this.token = params['token'] || '';
      
      if (this.token) {
        this.verifyEmail();
      }
    });
  }

  verifyEmail(): void {
    if (!this.token) {
      this.verificationStatus = 'error';
      this.errorMessage = 'Token de verificación no válido.';
      return;
    }

    this.isVerifying = true;
    this.verificationStatus = 'pending';

    this.authService.verifyEmail(this.token).subscribe({
      next: (response) => {
        this.isVerifying = false;
        this.verificationStatus = 'success';
        this.notificationService.showSuccess('¡Email verificado exitosamente!');
        
        // Redirigir al dashboard después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 2000);
      },
      error: (error) => {
        this.isVerifying = false;
        this.verificationStatus = 'error';
        this.handleVerificationError(error);
      }
    });
  }

  private handleVerificationError(error: any): void {
    if (error.status === 400) {
      this.errorMessage = 'Token de verificación inválido o expirado.';
    } else if (error.status === 404) {
      this.errorMessage = 'Token de verificación no encontrado.';
    } else {
      this.errorMessage = 'Error al verificar el email. Inténtalo de nuevo.';
    }
  }

  resendVerification(): void {
    if (!this.email) {
      this.notificationService.showError('Email no disponible para reenvío.');
      return;
    }

    this.isResending = true;
    this.authService.resendVerification(this.email).subscribe({
      next: (response) => {
        this.isResending = false;
        this.notificationService.showSuccess('Correo de verificación reenviado.');
      },
      error: (error) => {
        this.isResending = false;
        this.handleResendError(error);
      }
    });
  }

  private handleResendError(error: any): void {
    if (error.status === 400) {
      this.notificationService.showError('El correo ya ha sido verificado.');
    } else if (error.status === 404) {
      this.notificationService.showError('Usuario no encontrado.');
    } else {
      this.notificationService.showError('Error al reenviar el correo. Inténtalo de nuevo.');
    }
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
```

### **2. Template de Verificación**

```html
<!-- verify-email.component.html -->
<div class="verification-container">
  <div class="verification-card">
    <div class="verification-header">
      <h1>Verificar Email</h1>
    </div>

    <div class="verification-content">
      <!-- Pending State -->
      <div *ngIf="verificationStatus === 'pending'" class="verification-pending">
        <div class="spinner-container">
          <div class="spinner"></div>
        </div>
        <h2>Verificando tu email...</h2>
        <p>Por favor espera mientras verificamos tu dirección de correo electrónico.</p>
      </div>

      <!-- Success State -->
      <div *ngIf="verificationStatus === 'success'" class="verification-success">
        <div class="success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h2>¡Email Verificado!</h2>
        <p>Tu cuenta ha sido activada exitosamente. Serás redirigido al dashboard en unos segundos.</p>
        <button class="btn btn-primary" (click)="goToLogin()">
          Ir al Dashboard
        </button>
      </div>

      <!-- Error State -->
      <div *ngIf="verificationStatus === 'error'" class="verification-error">
        <div class="error-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h2>Error de Verificación</h2>
        <p>{{ errorMessage }}</p>
        
        <div class="error-actions">
          <button 
            class="btn btn-primary" 
            (click)="resendVerification()" 
            [disabled]="isResending"
            *ngIf="email"
          >
            <span *ngIf="isResending" class="spinner"></span>
            {{ isResending ? 'Reenviando...' : 'Reenviar Correo' }}
          </button>
          <button class="btn btn-secondary" (click)="goToLogin()">
            Ir al Login
          </button>
        </div>
      </div>

      <!-- No Token State - Manual Verification -->
      <div *ngIf="!token && verificationStatus === 'pending'" class="verification-manual">
        <div class="manual-icon">
          <i class="fas fa-envelope"></i>
        </div>
        <h2>Verificación Manual</h2>
        <p>Si no recibiste el correo de verificación, puedes solicitarlo nuevamente:</p>
        
        <div class="manual-actions">
          <button 
            class="btn btn-primary" 
            (click)="resendVerification()" 
            [disabled]="isResending || !email"
          >
            <span *ngIf="isResending" class="spinner"></span>
            {{ isResending ? 'Reenviando...' : 'Reenviar Correo' }}
          </button>
          <button class="btn btn-secondary" (click)="goToLogin()">
            Ir al Login
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## 🔧 **Servicio de Autenticación**

```typescript
// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  userType: string;
  acceptTermsAndConditions: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  userType: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  register(registerData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, registerData);
  }

  verifyEmail(token: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/verify-email`, { token });
  }

  resendVerification(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/resend-verification`, { email });
  }

  verifyEmailFromUrl(token: string): Observable<{ message: string }> {
    return this.http.get<{ message: string }>(`${this.apiUrl}/verify-email/${token}`);
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          this.setCurrentUser(response.user);
          this.setTokens(response.accessToken, response.refreshToken);
        })
      );
  }

  logout(): void {
    this.clearTokens();
    this.currentUserSubject.next(null);
  }

  private setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  private clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }
}
```

---

## 🎨 **Estilos CSS Recomendados**

```scss
// registration.component.scss
.registration-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.registration-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 500px;
}

.registration-header {
  text-align: center;
  margin-bottom: 30px;
  
  h1 {
    color: #333;
    margin-bottom: 10px;
    font-size: 28px;
    font-weight: 600;
  }
  
  p {
    color: #666;
    font-size: 16px;
  }
}

.registration-form {
  .form-group {
    margin-bottom: 20px;
    
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #333;
    }
    
    .input-with-status {
      position: relative;
      
      .form-control {
        width: 100%;
        padding: 12px 40px 12px 16px; // Espacio para el indicador
        border: 2px solid #e1e5e9;
        border-radius: 8px;
        font-size: 16px;
        transition: border-color 0.3s ease;
        
        &:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }
        
        &.is-invalid {
          border-color: #dc3545;
        }
        
        &.is-valid {
          border-color: #28a745;
          box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.1);
        }
      }
      
      .input-status {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &.status-checking {
          color: #007bff;
        }
        
        &.status-available {
          color: #28a745;
        }
        
        &.status-taken {
          color: #dc3545;
        }
        
        &.status-invalid {
          color: #dc3545;
        }
        
        &.status-neutral {
          display: none;
        }
      }
    }
    
    .form-control {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.3s ease;
      
      &:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
      }
      
      &.is-invalid {
        border-color: #dc3545;
      }
    }
    
    .password-input {
      position: relative;
      
      .password-toggle {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        
        &:hover {
          color: #333;
        }
      }
    }
    
    .checkbox-group {
      .checkbox-label {
        display: flex;
        align-items: flex-start;
        cursor: pointer;
        font-size: 14px;
        line-height: 1.5;
        
        .form-checkbox {
          margin-right: 12px;
          margin-top: 2px;
        }
        
        a {
          color: #007bff;
          text-decoration: none;
          
          &:hover {
            text-decoration: underline;
          }
        }
      }
    }
    
    .invalid-feedback {
      color: #dc3545;
      font-size: 14px;
      margin-top: 5px;
    }
    
    .valid-feedback {
      color: #28a745;
      font-size: 14px;
      margin-top: 5px;
      font-weight: 500;
    }
  }
  
  .btn {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &.btn-primary {
      background: #007bff;
      color: white;
      
      &:hover:not(:disabled) {
        background: #0056b3;
        transform: translateY(-1px);
      }
      
      &:disabled {
        background: #6c757d;
        cursor: not-allowed;
      }
    }
    
    &.btn-block {
      width: 100%;
    }
    
    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #ffffff;
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 1s ease-in-out infinite;
      margin-right: 8px;
    }
  }
}

.registration-footer {
  text-align: center;
  margin-top: 30px;
  
  p {
    color: #666;
    font-size: 14px;
    
    a {
      color: #007bff;
      text-decoration: none;
      font-weight: 500;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// Animaciones para los indicadores de validación
.fa-spinner {
  animation: spin 1s linear infinite;
}

// Estados de validación en tiempo real
.form-group {
  .input-with-status {
    .form-control {
      padding-right: 40px; // Espacio para el indicador
    }
  }
}

// verify-email.component.scss
.verification-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.verification-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 500px;
  text-align: center;
}

.verification-header h1 {
  color: #333;
  margin-bottom: 30px;
  font-size: 28px;
  font-weight: 600;
}

.verification-content {
  .verification-pending {
    .spinner-container {
      margin-bottom: 20px;
      
      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #e1e5e9;
        border-radius: 50%;
        border-top-color: #007bff;
        animation: spin 1s ease-in-out infinite;
        margin: 0 auto;
      }
    }
    
    h2 {
      color: #333;
      margin-bottom: 10px;
    }
    
    p {
      color: #666;
    }
  }
  
  .verification-success {
    .success-icon {
      margin-bottom: 20px;
      
      i {
        font-size: 60px;
        color: #28a745;
      }
    }
    
    h2 {
      color: #28a745;
      margin-bottom: 10px;
    }
    
    p {
      color: #666;
      margin-bottom: 20px;
    }
  }
  
  .verification-error {
    .error-icon {
      margin-bottom: 20px;
      
      i {
        font-size: 60px;
        color: #dc3545;
      }
    }
    
    h2 {
      color: #dc3545;
      margin-bottom: 10px;
    }
    
    p {
      color: #666;
      margin-bottom: 20px;
    }
    
    .error-actions {
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
    }
  }
  
  .verification-manual {
    .manual-icon {
      margin-bottom: 20px;
      
      i {
        font-size: 60px;
        color: #007bff;
      }
    }
    
    h2 {
      color: #333;
      margin-bottom: 10px;
    }
    
    p {
      color: #666;
      margin-bottom: 20px;
    }
    
    .manual-actions {
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
    }
  }
}
```

---

## 🚨 **Manejo de Errores**

### **1. Servicio de Notificaciones**

```typescript
// notification.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  showSuccess(message: string, duration: number = 5000): void {
    this.addNotification({
      id: this.generateId(),
      type: 'success',
      message,
      duration
    });
  }

  showError(message: string, duration: number = 7000): void {
    this.addNotification({
      id: this.generateId(),
      type: 'error',
      message,
      duration
    });
  }

  showWarning(message: string, duration: number = 5000): void {
    this.addNotification({
      id: this.generateId(),
      type: 'warning',
      message,
      duration
    });
  }

  showInfo(message: string, duration: number = 5000): void {
    this.addNotification({
      id: this.generateId(),
      type: 'info',
      message,
      duration
    });
  }

  private addNotification(notification: Notification): void {
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([...current, notification]);

    if (notification.duration) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, notification.duration);
    }
  }

  removeNotification(id: string): void {
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next(current.filter(n => n.id !== id));
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
```

### **2. Componente de Notificaciones**

```typescript
// notification.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from '../services/notification.service';

@Component({
  selector: 'app-notification',
  template: `
    <div class="notification-container">
      <div
        *ngFor="let notification of notifications"
        class="notification"
        [ngClass]="'notification-' + notification.type"
        (click)="removeNotification(notification.id)"
      >
        <div class="notification-content">
          <i [class]="getIconClass(notification.type)"></i>
          <span>{{ notification.message }}</span>
        </div>
        <button class="notification-close" (click)="removeNotification(notification.id)">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private subscription: Subscription = new Subscription();

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.subscription = this.notificationService.notifications$.subscribe(
      notifications => this.notifications = notifications
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  removeNotification(id: string): void {
    this.notificationService.removeNotification(id);
  }

  getIconClass(type: string): string {
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };
    return icons[type] || 'fas fa-info-circle';
  }
}
```

---

## 🧪 **Testing**

### **1. Tests Unitarios**

```typescript
// registration.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { RegistrationComponent } from './registration.component';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

describe('RegistrationComponent', () => {
  let component: RegistrationComponent;
  let fixture: ComponentFixture<RegistrationComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['register']);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [RegistrationComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrationComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with validators', () => {
    component.ngOnInit();
    expect(component.registrationForm).toBeDefined();
    expect(component.registrationForm.get('username')?.hasError('required')).toBeTruthy();
    expect(component.registrationForm.get('email')?.hasError('required')).toBeTruthy();
    expect(component.registrationForm.get('password')?.hasError('required')).toBeTruthy();
  });

  it('should validate password match', () => {
    component.ngOnInit();
    component.registrationForm.patchValue({
      password: 'TestPass123!',
      confirmPassword: 'DifferentPass123!'
    });
    
    expect(component.registrationForm.hasError('passwordMismatch')).toBeTruthy();
  });

  it('should call authService.register on valid form submission', () => {
    const mockResponse = {
      accessToken: 'token',
      refreshToken: 'refresh',
      expiresIn: 900,
      user: {} as any
    };
    
    authService.register.and.returnValue(of(mockResponse));
    component.ngOnInit();
    
    component.registrationForm.patchValue({
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPass123!',
      confirmPassword: 'TestPass123!',
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890',
      userType: 'CUSTOMER',
      acceptTermsAndConditions: true
    });

    component.onSubmit();

    expect(authService.register).toHaveBeenCalled();
    expect(notificationService.showSuccess).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/verify-email'], jasmine.any(Object));
  });

  it('should handle registration error with specific messages', () => {
    const error = { status: 409, error: { message: 'User with this username already exists' } };
    authService.register.and.returnValue(throwError(error));
    component.ngOnInit();
    
    component.registrationForm.patchValue({
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPass123!',
      confirmPassword: 'TestPass123!',
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890',
      userType: 'CUSTOMER',
      acceptTermsAndConditions: true
    });

    component.onSubmit();

    expect(notificationService.showError).toHaveBeenCalledWith('Este nombre de usuario ya está en uso.');
    expect(component.registrationForm.get('username')?.errors?.['usernameExists']).toBeTruthy();
  });

  it('should handle email conflict error', () => {
    const error = { status: 409, error: { message: 'User with this email already exists' } };
    authService.register.and.returnValue(throwError(error));
    component.ngOnInit();
    
    component.registrationForm.patchValue({
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPass123!',
      confirmPassword: 'TestPass123!',
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890',
      userType: 'CUSTOMER',
      acceptTermsAndConditions: true
    });

    component.onSubmit();

    expect(notificationService.showError).toHaveBeenCalledWith('Este correo electrónico ya está registrado.');
    expect(component.registrationForm.get('email')?.errors?.['emailExists']).toBeTruthy();
  });

  it('should show checking state when validating username', () => {
    const validationService = TestBed.inject(ValidationService) as jasmine.SpyObj<ValidationService>;
    validationService.checkUsername.and.returnValue(of({ exists: false, message: 'Available' }));
    
    component.ngOnInit();
    component.registrationForm.get('username')?.setValue('testuser');
    
    expect(component.usernameChecking).toBe(true);
  });

  it('should show available state when username is free', () => {
    const validationService = TestBed.inject(ValidationService) as jasmine.SpyObj<ValidationService>;
    validationService.checkUsername.and.returnValue(of({ exists: false, message: 'Available' }));
    
    component.ngOnInit();
    component.registrationForm.get('username')?.setValue('testuser');
    
    expect(component.usernameAvailable).toBe(true);
  });
});
```

---

## 🎯 **Consideraciones de UX**

### **1. Estados de Carga**
- **Spinner** durante el registro
- **Botón deshabilitado** mientras se procesa
- **Mensajes de progreso** claros

### **2. Validación en Tiempo Real**
- **Validación instantánea** de campos
- **Mensajes de error** específicos
- **Indicadores visuales** de validación

### **3. Feedback Visual**
- **Notificaciones** de éxito/error
- **Estados de verificación** claros
- **Redirecciones** automáticas

### **4. Accesibilidad**
- **Labels** descriptivos
- **Contraste** adecuado
- **Navegación** por teclado
- **Screen readers** compatibles

---

## 📱 **Responsive Design**

### **Breakpoints Recomendados**
```scss
// Mobile First
@media (max-width: 576px) {
  .registration-card {
    padding: 20px;
    margin: 10px;
  }
}

@media (min-width: 768px) {
  .registration-card {
    max-width: 600px;
  }
}

@media (min-width: 992px) {
  .registration-card {
    max-width: 700px;
  }
}
```

---

## 🔒 **Seguridad Frontend**

### **1. Validación Local**
- **Sanitización** de inputs
- **Validación** de tipos de datos
- **Prevención** de XSS

### **2. Manejo de Tokens**
- **Almacenamiento seguro** en localStorage
- **Limpieza** al logout
- **Renovación** automática

### **3. HTTPS**
- **Solo HTTPS** en producción
- **Validación** de certificados
- **Headers** de seguridad

---

## 📊 **Métricas y Analytics**

### **1. Eventos a Trackear**
- **Registro iniciado**
- **Registro completado**
- **Verificación de email**
- **Errores de validación**
- **Tiempo de registro**
- **Username validation started** - Usuario comenzó a escribir username
- **Username validation completed** - Validación de username completada
- **Email validation started** - Usuario comenzó a escribir email
- **Email validation completed** - Validación de email completada
- **Username conflict detected** - Username ya existe detectado
- **Email conflict detected** - Email ya existe detectado

### **2. Implementación**
```typescript
// analytics.service.ts
trackEvent(eventName: string, properties?: any): void {
  // Implementar tracking con Google Analytics, Mixpanel, etc.
  console.log('Event:', eventName, properties);
}
```

---

## 🚀 **Despliegue**

### **1. Variables de Entorno**
```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  frontendUrl: 'http://localhost:4200'
};
```

### **2. Build de Producción**
```bash
ng build --prod
ng build --configuration=production
```

---

## 📚 **Recursos Adicionales**

### **1. Documentación Angular**
- [Reactive Forms](https://angular.io/guide/reactive-forms)
- [HTTP Client](https://angular.io/guide/http)
- [Routing](https://angular.io/guide/routing)

### **2. Mejores Prácticas**
- [Angular Style Guide](https://angular.io/guide/styleguide)
- [Security Best Practices](https://angular.io/guide/security)
- [Performance Optimization](https://angular.io/guide/performance-checklist)

---

**¡Esta documentación proporciona todo lo necesario para implementar el sistema de registro y verificación de email en el frontend con validación en tiempo real!** 🎉

**Última actualización:** 26 de septiembre de 2025  
**Versión:** 2.1.0  
**Autor:** Sistema Pritzio

### **🆕 Cambios en la Versión 2.1.0:**
- ✅ **Endpoint de reenvío** de verificación de email
- ✅ **Verificación automática** desde URL (GET)
- ✅ **Estados de reenvío** con indicadores visuales
- ✅ **Manejo de errores** específicos para reenvío
- ✅ **Flujo completo** de verificación de email

### **🆕 Cambios en la Versión 2.0.0:**
- ✅ **Validación en tiempo real** de username y email
- ✅ **Mensajes de error específicos** para cada campo
- ✅ **Indicadores visuales** con estados de validación
- ✅ **Nuevos endpoints** de verificación
- ✅ **Mejoras de UX** significativas
- ✅ **Tests actualizados** para nuevas funcionalidades
