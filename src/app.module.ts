import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MenuModule } from './menu/menu.modules';

@Module({
  imports: [MenuModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
