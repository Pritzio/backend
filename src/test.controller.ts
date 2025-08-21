import { Controller, Get } from '@nestjs/common';

@Controller('test')
export class TestController {
  @Get('simple')
  getSimple() {
    return { message: 'Simple test endpoint works!' };
  }
}
