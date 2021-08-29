import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname, '..', 'public'),
    //   serveStaticOptions:{
    //     extensions: ['jpg', 'jpeg', 'png', 'gif','csv'],
    //   }
    // }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
