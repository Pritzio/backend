import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserType, UserStatus } from '../entities/user.entity';
import { Role, RoleType } from '../entities/role.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SuperAdminSeeder {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async seed(): Promise<void> {
    console.log('🌱 Iniciando creación de Super Admin...');

    // Obtener configuración desde variables de entorno
    const username = process.env.SUPER_ADMIN_USERNAME || 'admin';
    const email = process.env.SUPER_ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'admin123';
    const firstName = process.env.SUPER_ADMIN_FIRST_NAME || 'Super';
    const lastName = process.env.SUPER_ADMIN_LAST_NAME || 'Admin';

    console.log(`📋 Configuración del Super Admin:`);
    console.log(`   👤 Usuario: ${username}`);
    console.log(`   📧 Email: ${email}`);
    console.log(`   🔑 Contraseña: ${password}`);
    console.log(`   📝 Nombre: ${firstName} ${lastName}`);

    // Verificar si el usuario ya existe
    const existingUser = await this.userRepository.findOne({
      where: [
        { username },
        { email }
      ],
    });

    if (existingUser) {
      console.log('⚠️ El usuario Super Admin ya existe:', existingUser.username);
      return;
    }

    // Obtener el rol SUPER_ADMIN
    const superAdminRole = await this.roleRepository.findOne({
      where: { name: RoleType.SUPER_ADMIN },
    });

    if (!superAdminRole) {
      console.error('❌ Error: El rol SUPER_ADMIN no existe. Ejecuta primero auth.seeder.ts');
      return;
    }

    // Crear el usuario Super Admin
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const superAdminUser = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      type: UserType.SYSTEM,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      phoneVerified: false,
      isVerified: true,
      roles: [superAdminRole],
      metadata: {
        createdBy: 'system',
        purpose: 'super_admin_initial_setup',
        notes: 'Usuario Super Admin creado por seeder'
      }
    });

    try {
      const savedUser = await this.userRepository.save(superAdminUser);
      console.log('✅ Super Admin creado exitosamente:');
      console.log(`   👤 Usuario: ${savedUser.username}`);
      console.log(`   📧 Email: ${savedUser.email}`);
      console.log(`   🔑 Contraseña: losbar191184`);
      console.log(`   🏷️ Tipo: ${savedUser.type}`);
      console.log(`   📊 Estado: ${savedUser.status}`);
      console.log(`   🔐 Roles: ${savedUser.roles.map(role => role.name).join(', ')}`);
      console.log(`   🆔 ID: ${savedUser.id}`);
      console.log(`   📅 Creado: ${savedUser.createdAt}`);
      
      // Verificar que el usuario tiene el rol correcto
      const userWithRoles = await this.userRepository.findOne({
        where: { id: savedUser.id },
        relations: ['roles', 'roles.permissions'],
      });

      if (userWithRoles && userWithRoles.roles.length > 0) {
        console.log(`   🔐 Permisos totales: ${userWithRoles.roles.reduce((total, role) => total + (role.permissions?.length || 0), 0)}`);
      }

    } catch (error) {
      console.error('❌ Error creando Super Admin:', error.message);
      throw error;
    }
  }

  async verifySuperAdmin(): Promise<void> {
    console.log('🔍 Verificando Super Admin existente...');
    
    const username = process.env.SUPER_ADMIN_USERNAME || 'admin';
    
    const superAdmin = await this.userRepository.findOne({
      where: { username },
      relations: ['roles', 'roles.permissions'],
    });

    if (superAdmin) {
      console.log('✅ Super Admin encontrado:');
      console.log(`   👤 Usuario: ${superAdmin.username}`);
      console.log(`   📧 Email: ${superAdmin.email}`);
      console.log(`   🏷️ Tipo: ${superAdmin.type}`);
      console.log(`   📊 Estado: ${superAdmin.status}`);
      console.log(`   🔐 Roles: ${superAdmin.roles.map(role => role.name).join(', ')}`);
      console.log(`   📅 Creado: ${superAdmin.createdAt}`);
      
      if (superAdmin.roles.length > 0) {
        const totalPermissions = superAdmin.roles.reduce((total, role) => total + (role.permissions?.length || 0), 0);
        console.log(`   🔐 Permisos totales: ${totalPermissions}`);
      }
    } else {
      console.log('❌ Super Admin no encontrado');
    }
  }
}
