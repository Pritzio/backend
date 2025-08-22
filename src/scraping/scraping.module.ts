import { Module } from '@nestjs/common';
import { ScrapingController } from './controllers/scraping.controller';
import { ScrapingService } from './services/scraping.service';

@Module({
  controllers: [ScrapingController],
  providers: [ScrapingService],
  exports: [ScrapingService],
})
export class ScrapingModule {}
