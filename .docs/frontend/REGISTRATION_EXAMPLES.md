# 📝 Ejemplos de Integración - Registro y Verificación

## 🚀 **Ejemplos Prácticos para Frontend**

### **1. Ejemplo Completo con React**

```tsx
// RegistrationForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

interface RegistrationData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  userType: string;
  acceptTermsAndConditions: boolean;
}

const RegistrationForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError
  } = useForm<RegistrationData>();

  const password = watch('password');

  const onSubmit = async (data: RegistrationData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          confirmPassword: undefined // No enviar al backend
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert('¡Registro exitoso! Revisa tu correo para verificar tu cuenta.');
        navigate(`/verify-email?email=${data.email}`);
      } else {
        const error = await response.json();
        handleRegistrationError(error);
      }
    } catch (error) {
      alert('Error al registrar. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistrationError = (error: any) => {
    if (error.status === 409) {
      if (error.message.includes('username')) {
        setError('username', { type: 'manual', message: 'Este nombre de usuario ya está en uso.' });
      } else if (error.message.includes('email')) {
        setError('email', { type: 'manual', message: 'Este correo electrónico ya está registrado.' });
      }
    } else {
      alert('Error al registrar. Por favor, revisa los datos ingresados.');
    }
  };

  return (
    <div className="registration-container">
      <div className="registration-card">
        <h1>Crear Cuenta</h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Username */}
          <div className="form-group">
            <label>Nombre de Usuario *</label>
            <input
              type="text"
              {...register('username', {
                required: 'Nombre de usuario es requerido',
                minLength: { value: 3, message: 'Mínimo 3 caracteres' },
                maxLength: { value: 50, message: 'Máximo 50 caracteres' },
                pattern: {
                  value: /^[a-zA-Z0-9_]+$/,
                  message: 'Solo letras, números y guiones bajos'
                }
              })}
              className={errors.username ? 'error' : ''}
            />
            {errors.username && <span className="error-message">{errors.username.message}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Correo Electrónico *</label>
            <input
              type="email"
              {...register('email', {
                required: 'Correo electrónico es requerido',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Formato de correo inválido'
                }
              })}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email.message}</span>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label>Contraseña *</label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password', {
                  required: 'Contraseña es requerida',
                  minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                    message: 'Debe contener mayúscula, minúscula, número y símbolo'
                  }
                })}
                className={errors.password ? 'error' : ''}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password.message}</span>}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label>Confirmar Contraseña *</label>
            <div className="password-input">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword', {
                  required: 'Confirmar contraseña es requerido',
                  validate: value => value === password || 'Las contraseñas no coinciden'
                })}
                className={errors.confirmPassword ? 'error' : ''}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="password-toggle"
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword.message}</span>}
          </div>

          {/* First Name */}
          <div className="form-group">
            <label>Nombre *</label>
            <input
              type="text"
              {...register('firstName', {
                required: 'Nombre es requerido',
                minLength: { value: 2, message: 'Mínimo 2 caracteres' },
                maxLength: { value: 100, message: 'Máximo 100 caracteres' }
              })}
              className={errors.firstName ? 'error' : ''}
            />
            {errors.firstName && <span className="error-message">{errors.firstName.message}</span>}
          </div>

          {/* Last Name */}
          <div className="form-group">
            <label>Apellido *</label>
            <input
              type="text"
              {...register('lastName', {
                required: 'Apellido es requerido',
                minLength: { value: 2, message: 'Mínimo 2 caracteres' },
                maxLength: { value: 100, message: 'Máximo 100 caracteres' }
              })}
              className={errors.lastName ? 'error' : ''}
            />
            {errors.lastName && <span className="error-message">{errors.lastName.message}</span>}
          </div>

          {/* Phone */}
          <div className="form-group">
            <label>Teléfono *</label>
            <input
              type="tel"
              {...register('phone', {
                required: 'Teléfono es requerido',
                minLength: { value: 10, message: 'Mínimo 10 caracteres' },
                maxLength: { value: 20, message: 'Máximo 20 caracteres' },
                pattern: {
                  value: /^\+?[\d\s\-\(\)]+$/,
                  message: 'Formato de teléfono inválido'
                }
              })}
              className={errors.phone ? 'error' : ''}
            />
            {errors.phone && <span className="error-message">{errors.phone.message}</span>}
          </div>

          {/* Terms and Conditions */}
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                {...register('acceptTermsAndConditions', {
                  required: 'Debes aceptar los términos y condiciones'
                })}
                className={errors.acceptTermsAndConditions ? 'error' : ''}
              />
              Acepto los <a href="/terms" target="_blank">Términos y Condiciones</a> y la <a href="/privacy" target="_blank">Política de Privacidad</a> *
            </label>
            {errors.acceptTermsAndConditions && <span className="error-message">{errors.acceptTermsAndConditions.message}</span>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <div className="registration-footer">
          <p>¿Ya tienes cuenta? <a href="/login">Inicia sesión</a></p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;
```

### **2. Componente de Verificación de Email (React)**

```tsx
// VerifyEmail.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const email = searchParams.get('email');
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      verifyEmail();
    }
  }, [token]);

  const verifyEmail = async () => {
    if (!token) {
      setVerificationStatus('error');
      setErrorMessage('Token de verificación no válido.');
      return;
    }

    setIsVerifying(true);
    setVerificationStatus('pending');

    try {
      const response = await fetch('/api/v1/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        setVerificationStatus('success');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        const error = await response.json();
        setVerificationStatus('error');
        setErrorMessage(error.message || 'Error al verificar el email.');
      }
    } catch (error) {
      setVerificationStatus('error');
      setErrorMessage('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setIsVerifying(false);
    }
  };

  const resendVerification = async () => {
    if (!email) {
      alert('Email no disponible para reenvío.');
      return;
    }

    try {
      const response = await fetch('/api/v1/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        alert('Correo de verificación reenviado.');
      } else {
        alert('Error al reenviar el correo. Inténtalo de nuevo.');
      }
    } catch (error) {
      alert('Error de conexión. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="verification-container">
      <div className="verification-card">
        <h1>Verificar Email</h1>

        {verificationStatus === 'pending' && (
          <div className="verification-pending">
            <div className="spinner"></div>
            <h2>Verificando tu email...</h2>
            <p>Por favor espera mientras verificamos tu dirección de correo electrónico.</p>
          </div>
        )}

        {verificationStatus === 'success' && (
          <div className="verification-success">
            <div className="success-icon">✅</div>
            <h2>¡Email Verificado!</h2>
            <p>Tu cuenta ha sido activada exitosamente. Serás redirigido al dashboard en unos segundos.</p>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              Ir al Dashboard
            </button>
          </div>
        )}

        {verificationStatus === 'error' && (
          <div className="verification-error">
            <div className="error-icon">❌</div>
            <h2>Error de Verificación</h2>
            <p>{errorMessage}</p>
            <div className="error-actions">
              {email && (
                <button className="btn btn-primary" onClick={resendVerification}>
                  Reenviar Correo
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => navigate('/login')}>
                Ir al Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
```

### **3. Ejemplo con Vue.js**

```vue
<!-- RegistrationForm.vue -->
<template>
  <div class="registration-container">
    <div class="registration-card">
      <h1>Crear Cuenta</h1>
      <form @submit.prevent="onSubmit">
        <!-- Username -->
        <div class="form-group">
          <label>Nombre de Usuario *</label>
          <input
            v-model="form.username"
            type="text"
            :class="{ error: errors.username }"
            @blur="validateField('username')"
          />
          <span v-if="errors.username" class="error-message">{{ errors.username }}</span>
        </div>

        <!-- Email -->
        <div class="form-group">
          <label>Correo Electrónico *</label>
          <input
            v-model="form.email"
            type="email"
            :class="{ error: errors.email }"
            @blur="validateField('email')"
          />
          <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
        </div>

        <!-- Password -->
        <div class="form-group">
          <label>Contraseña *</label>
          <div class="password-input">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              :class="{ error: errors.password }"
              @blur="validateField('password')"
            />
            <button type="button" @click="showPassword = !showPassword" class="password-toggle">
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
          <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
        </div>

        <!-- Confirm Password -->
        <div class="form-group">
          <label>Confirmar Contraseña *</label>
          <div class="password-input">
            <input
              v-model="form.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              :class="{ error: errors.confirmPassword }"
              @blur="validateField('confirmPassword')"
            />
            <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="password-toggle">
              {{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
          <span v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</span>
        </div>

        <!-- First Name -->
        <div class="form-group">
          <label>Nombre *</label>
          <input
            v-model="form.firstName"
            type="text"
            :class="{ error: errors.firstName }"
            @blur="validateField('firstName')"
          />
          <span v-if="errors.firstName" class="error-message">{{ errors.firstName }}</span>
        </div>

        <!-- Last Name -->
        <div class="form-group">
          <label>Apellido *</label>
          <input
            v-model="form.lastName"
            type="text"
            :class="{ error: errors.lastName }"
            @blur="validateField('lastName')"
          />
          <span v-if="errors.lastName" class="error-message">{{ errors.lastName }}</span>
        </div>

        <!-- Phone -->
        <div class="form-group">
          <label>Teléfono *</label>
          <input
            v-model="form.phone"
            type="tel"
            :class="{ error: errors.phone }"
            @blur="validateField('phone')"
          />
          <span v-if="errors.phone" class="error-message">{{ errors.phone }}</span>
        </div>

        <!-- Terms and Conditions -->
        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input
              v-model="form.acceptTermsAndConditions"
              type="checkbox"
              :class="{ error: errors.acceptTermsAndConditions }"
            />
            Acepto los <a href="/terms" target="_blank">Términos y Condiciones</a> y la <a href="/privacy" target="_blank">Política de Privacidad</a> *
          </label>
          <span v-if="errors.acceptTermsAndConditions" class="error-message">{{ errors.acceptTermsAndConditions }}</span>
        </div>

        <!-- Submit Button -->
        <button type="submit" :disabled="isLoading" class="btn btn-primary">
          {{ isLoading ? 'Creando cuenta...' : 'Crear Cuenta' }}
        </button>
      </form>

      <div class="registration-footer">
        <p>¿Ya tienes cuenta? <a href="/login">Inicia sesión</a></p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'RegistrationForm',
  setup() {
    const router = useRouter()
    const isLoading = ref(false)
    const showPassword = ref(false)
    const showConfirmPassword = ref(false)
    
    const form = reactive({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
      userType: 'CUSTOMER',
      acceptTermsAndConditions: false
    })

    const errors = reactive({})

    const validateField = (fieldName) => {
      const value = form[fieldName]
      delete errors[fieldName]

      switch (fieldName) {
        case 'username':
          if (!value) errors.username = 'Nombre de usuario es requerido'
          else if (value.length < 3) errors.username = 'Mínimo 3 caracteres'
          else if (value.length > 50) errors.username = 'Máximo 50 caracteres'
          else if (!/^[a-zA-Z0-9_]+$/.test(value)) errors.username = 'Solo letras, números y guiones bajos'
          break
        case 'email':
          if (!value) errors.email = 'Correo electrónico es requerido'
          else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.email = 'Formato de correo inválido'
          break
        case 'password':
          if (!value) errors.password = 'Contraseña es requerida'
          else if (value.length < 8) errors.password = 'Mínimo 8 caracteres'
          else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(value)) {
            errors.password = 'Debe contener mayúscula, minúscula, número y símbolo'
          }
          break
        case 'confirmPassword':
          if (!value) errors.confirmPassword = 'Confirmar contraseña es requerido'
          else if (value !== form.password) errors.confirmPassword = 'Las contraseñas no coinciden'
          break
        case 'firstName':
          if (!value) errors.firstName = 'Nombre es requerido'
          else if (value.length < 2) errors.firstName = 'Mínimo 2 caracteres'
          else if (value.length > 100) errors.firstName = 'Máximo 100 caracteres'
          break
        case 'lastName':
          if (!value) errors.lastName = 'Apellido es requerido'
          else if (value.length < 2) errors.lastName = 'Mínimo 2 caracteres'
          else if (value.length > 100) errors.lastName = 'Máximo 100 caracteres'
          break
        case 'phone':
          if (!value) errors.phone = 'Teléfono es requerido'
          else if (value.length < 10) errors.phone = 'Mínimo 10 caracteres'
          else if (value.length > 20) errors.phone = 'Máximo 20 caracteres'
          else if (!/^\+?[\d\s\-\(\)]+$/.test(value)) errors.phone = 'Formato de teléfono inválido'
          break
        case 'acceptTermsAndConditions':
          if (!value) errors.acceptTermsAndConditions = 'Debes aceptar los términos y condiciones'
          break
      }
    }

    const validateForm = () => {
      Object.keys(form).forEach(field => {
        if (field !== 'confirmPassword') {
          validateField(field)
        }
      })
      validateField('confirmPassword')
      return Object.keys(errors).length === 0
    }

    const onSubmit = async () => {
      if (!validateForm() || isLoading.value) return

      isLoading.value = true

      try {
        const response = await fetch('/api/v1/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...form,
            confirmPassword: undefined
          }),
        })

        if (response.ok) {
          alert('¡Registro exitoso! Revisa tu correo para verificar tu cuenta.')
          router.push(`/verify-email?email=${form.email}`)
        } else {
          const error = await response.json()
          handleRegistrationError(error)
        }
      } catch (error) {
        alert('Error al registrar. Inténtalo de nuevo.')
      } finally {
        isLoading.value = false
      }
    }

    const handleRegistrationError = (error) => {
      if (error.status === 409) {
        if (error.message.includes('username')) {
          errors.username = 'Este nombre de usuario ya está en uso.'
        } else if (error.message.includes('email')) {
          errors.email = 'Este correo electrónico ya está registrado.'
        }
      } else {
        alert('Error al registrar. Por favor, revisa los datos ingresados.')
      }
    }

    return {
      form,
      errors,
      isLoading,
      showPassword,
      showConfirmPassword,
      validateField,
      onSubmit
    }
  }
}
</script>

<style scoped>
/* Estilos similares a los ejemplos anteriores */
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

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-group input.error {
  border-color: #dc3545;
}

.password-input {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
}

.error-message {
  color: #dc3545;
  font-size: 14px;
  margin-top: 5px;
  display: block;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #007bff;
  color: white;
  width: 100%;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.registration-footer {
  text-align: center;
  margin-top: 30px;
}

.registration-footer a {
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
}

.registration-footer a:hover {
  text-decoration: underline;
}
</style>
```

### **4. Ejemplo con JavaScript Vanilla**

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registro - Pritzio</title>
    <style>
        /* Estilos CSS similares a los ejemplos anteriores */
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
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #333;
        }
        
        .form-group input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s ease;
            box-sizing: border-box;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }
        
        .form-group input.error {
            border-color: #dc3545;
        }
        
        .error-message {
            color: #dc3545;
            font-size: 14px;
            margin-top: 5px;
            display: block;
        }
        
        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            width: 100%;
        }
        
        .btn-primary {
            background: #007bff;
            color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
            background: #0056b3;
            transform: translateY(-1px);
        }
        
        .btn-primary:disabled {
            background: #6c757d;
            cursor: not-allowed;
        }
        
        .password-input {
            position: relative;
        }
        
        .password-toggle {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #666;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="registration-container">
        <div class="registration-card">
            <h1>Crear Cuenta</h1>
            <form id="registrationForm">
                <!-- Username -->
                <div class="form-group">
                    <label for="username">Nombre de Usuario *</label>
                    <input type="text" id="username" name="username" required>
                    <span class="error-message" id="username-error"></span>
                </div>

                <!-- Email -->
                <div class="form-group">
                    <label for="email">Correo Electrónico *</label>
                    <input type="email" id="email" name="email" required>
                    <span class="error-message" id="email-error"></span>
                </div>

                <!-- Password -->
                <div class="form-group">
                    <label for="password">Contraseña *</label>
                    <div class="password-input">
                        <input type="password" id="password" name="password" required>
                        <button type="button" class="password-toggle" onclick="togglePassword('password')">👁️</button>
                    </div>
                    <span class="error-message" id="password-error"></span>
                </div>

                <!-- Confirm Password -->
                <div class="form-group">
                    <label for="confirmPassword">Confirmar Contraseña *</label>
                    <div class="password-input">
                        <input type="password" id="confirmPassword" name="confirmPassword" required>
                        <button type="button" class="password-toggle" onclick="togglePassword('confirmPassword')">👁️</button>
                    </div>
                    <span class="error-message" id="confirmPassword-error"></span>
                </div>

                <!-- First Name -->
                <div class="form-group">
                    <label for="firstName">Nombre *</label>
                    <input type="text" id="firstName" name="firstName" required>
                    <span class="error-message" id="firstName-error"></span>
                </div>

                <!-- Last Name -->
                <div class="form-group">
                    <label for="lastName">Apellido *</label>
                    <input type="text" id="lastName" name="lastName" required>
                    <span class="error-message" id="lastName-error"></span>
                </div>

                <!-- Phone -->
                <div class="form-group">
                    <label for="phone">Teléfono *</label>
                    <input type="tel" id="phone" name="phone" required>
                    <span class="error-message" id="phone-error"></span>
                </div>

                <!-- Terms and Conditions -->
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="acceptTermsAndConditions" name="acceptTermsAndConditions" required>
                        Acepto los <a href="/terms" target="_blank">Términos y Condiciones</a> y la <a href="/privacy" target="_blank">Política de Privacidad</a> *
                    </label>
                    <span class="error-message" id="acceptTermsAndConditions-error"></span>
                </div>

                <!-- Submit Button -->
                <button type="submit" class="btn btn-primary" id="submitBtn">Crear Cuenta</button>
            </form>

            <div class="registration-footer">
                <p>¿Ya tienes cuenta? <a href="/login">Inicia sesión</a></p>
            </div>
        </div>
    </div>

    <script>
        // Validaciones
        const validations = {
            username: {
                required: true,
                minLength: 3,
                maxLength: 50,
                pattern: /^[a-zA-Z0-9_]+$/,
                message: 'Solo letras, números y guiones bajos'
            },
            email: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Formato de correo inválido'
            },
            password: {
                required: true,
                minLength: 8,
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                message: 'Debe contener mayúscula, minúscula, número y símbolo'
            },
            firstName: {
                required: true,
                minLength: 2,
                maxLength: 100
            },
            lastName: {
                required: true,
                minLength: 2,
                maxLength: 100
            },
            phone: {
                required: true,
                minLength: 10,
                maxLength: 20,
                pattern: /^\+?[\d\s\-\(\)]+$/,
                message: 'Formato de teléfono inválido'
            },
            acceptTermsAndConditions: {
                required: true,
                message: 'Debes aceptar los términos y condiciones'
            }
        };

        function validateField(fieldName, value) {
            const validation = validations[fieldName];
            if (!validation) return '';

            if (validation.required && !value) {
                return `${getFieldLabel(fieldName)} es requerido.`;
            }

            if (validation.minLength && value.length < validation.minLength) {
                return `${getFieldLabel(fieldName)} debe tener al menos ${validation.minLength} caracteres.`;
            }

            if (validation.maxLength && value.length > validation.maxLength) {
                return `${getFieldLabel(fieldName)} no puede exceder ${validation.maxLength} caracteres.`;
            }

            if (validation.pattern && !validation.pattern.test(value)) {
                return validation.message || 'Formato inválido.';
            }

            return '';
        }

        function getFieldLabel(fieldName) {
            const labels = {
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

        function showError(fieldName, message) {
            const errorElement = document.getElementById(`${fieldName}-error`);
            const inputElement = document.getElementById(fieldName);
            
            if (errorElement) {
                errorElement.textContent = message;
            }
            
            if (inputElement) {
                inputElement.classList.toggle('error', !!message);
            }
        }

        function clearErrors() {
            Object.keys(validations).forEach(fieldName => {
                showError(fieldName, '');
            });
        }

        function validateForm() {
            clearErrors();
            let isValid = true;

            Object.keys(validations).forEach(fieldName => {
                const inputElement = document.getElementById(fieldName);
                const value = inputElement ? inputElement.value : '';
                const error = validateField(fieldName, value);
                
                if (error) {
                    showError(fieldName, error);
                    isValid = false;
                }
            });

            // Validar confirmación de contraseña
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                showError('confirmPassword', 'Las contraseñas no coinciden.');
                isValid = false;
            }

            return isValid;
        }

        function togglePassword(fieldId) {
            const input = document.getElementById(fieldId);
            const button = input.nextElementSibling;
            
            if (input.type === 'password') {
                input.type = 'text';
                button.textContent = '👁️‍🗨️';
            } else {
                input.type = 'password';
                button.textContent = '👁️';
            }
        }

        async function submitForm(formData) {
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creando cuenta...';

            try {
                const response = await fetch('/api/v1/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                });

                if (response.ok) {
                    const result = await response.json();
                    alert('¡Registro exitoso! Revisa tu correo para verificar tu cuenta.');
                    window.location.href = `/verify-email?email=${formData.email}`;
                } else {
                    const error = await response.json();
                    handleRegistrationError(error);
                }
            } catch (error) {
                alert('Error al registrar. Inténtalo de nuevo.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Crear Cuenta';
            }
        }

        function handleRegistrationError(error) {
            if (error.status === 409) {
                if (error.message.includes('username')) {
                    showError('username', 'Este nombre de usuario ya está en uso.');
                } else if (error.message.includes('email')) {
                    showError('email', 'Este correo electrónico ya está registrado.');
                }
            } else {
                alert('Error al registrar. Por favor, revisa los datos ingresados.');
            }
        }

        // Event listeners
        document.getElementById('registrationForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!validateForm()) return;

            const formData = {
                username: document.getElementById('username').value,
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                phone: document.getElementById('phone').value,
                userType: 'CUSTOMER',
                acceptTermsAndConditions: document.getElementById('acceptTermsAndConditions').checked
            };

            await submitForm(formData);
        });

        // Validación en tiempo real
        Object.keys(validations).forEach(fieldName => {
            const inputElement = document.getElementById(fieldName);
            if (inputElement) {
                inputElement.addEventListener('blur', () => {
                    const value = inputElement.value;
                    const error = validateField(fieldName, value);
                    showError(fieldName, error);
                });
            }
        });
    </script>
</body>
</html>
```

---

## 🎯 **Resumen de Implementación**

### **✅ Lo que incluye esta documentación:**

1. **Guía completa** de implementación para Angular, React, Vue.js y JavaScript vanilla
2. **Validaciones** robustas tanto en frontend como backend
3. **Manejo de errores** específicos y user-friendly
4. **Estilos CSS** modernos y responsive
5. **Ejemplos de testing** unitario
6. **Consideraciones de UX** y accesibilidad
7. **Integración** con el sistema de correos del backend

### **🚀 Para el equipo de frontend:**

1. **Usar la guía principal** como referencia
2. **Adaptar los ejemplos** según el framework que usen
3. **Implementar las validaciones** exactamente como se muestran
4. **Seguir los patrones** de manejo de errores
5. **Probar exhaustivamente** con diferentes escenarios

**¡La documentación está lista para que el equipo de frontend implemente el sistema de registro y verificación de email!** 🎉
