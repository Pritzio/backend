import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { AuthSeeder } from './auth.seeder';

async function runSeeder() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const seeder = app.get(AuthSeeder);
    console.log('🌱 Starting authentication seeder...');
    
    await seeder.seed();
    
    console.log('✅ Authentication seeder completed successfully!');
    console.log('📋 Roles and permissions have been created.');
    
  } catch (error) {
    console.error('❌ Error running authentication seeder:', error);
  } finally {
    await app.close();
  }
}

runSeeder();
