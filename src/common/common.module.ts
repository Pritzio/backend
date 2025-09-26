import { Module } from '@nestjs/common';
import { SecurityModule } from './security/security.module';
import { EmailModule } from './modules/email.module';

@Module({
  imports: [SecurityModule, EmailModule],
  exports: [SecurityModule, EmailModule],
})
export class CommonModule {}
