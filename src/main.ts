import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as serveIndex from 'serve-index';
import { AppModule } from './app.module';
import { orderReccentFiles } from './utils';
import * as serveStatic from 'serve-static';

async function bootstrap() {

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
  );

  app.use('/public', serveIndex(join(__dirname, '../public'), {
    'icons': true,
    view:"details"
  }));
  app.use('/public', serveStatic(join(__dirname, '../public'), {
    maxAge: '1d',
    extensions: ['jpg', 'jpeg', 'png', 'gif','csv'],
   }));

  await app.listen(9001);

}
bootstrap();
