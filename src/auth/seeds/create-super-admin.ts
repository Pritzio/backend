#!/usr/bin/env ts-node

/**
 * 🚀 Script to Create Super Admin
 * 
 * Usage:
 * npm run seed:super-admin
 * 
 * Or execute directly:
 * npx ts-node src/auth/seeds/create-super-admin.ts
 */

require('dotenv').config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { SuperAdminSeeder } from './super-admin.seeder';

async function createSuperAdmin() {
  let app;
  
  try {
    // Create NestJS application
    app = await NestFactory.createApplicationContext(AppModule);
    
    // Get seeder
    const superAdminSeeder = app.get(SuperAdminSeeder);
    
    // Create super admin
    await superAdminSeeder.seed();
    
    // Verify created user
    await superAdminSeeder.verifySuperAdmin();
    
  } catch (error) {
    console.error('Error creating Super Admin:', error.message);
    process.exit(1);
  } finally {
    if (app) {
      await app.close();
    }
  }
}

// Execute if called directly
if (require.main === module) {
  createSuperAdmin()
    .then(() => {
      console.log('\n🎉 Super Admin created successfully!');
      console.log('\n📋 Access credentials:');
      console.log('   👤 Username:', process.env.SUPER_ADMIN_USERNAME || 'admin');
      console.log('   📧 Email:', process.env.SUPER_ADMIN_EMAIL || 'admin@example.com');
      console.log('   🔑 Password:', process.env.SUPER_ADMIN_PASSWORD || 'admin123');
      console.log('\n🔐 This user has full system access');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Fatal error:', error.message);
      process.exit(1);
    });
}
