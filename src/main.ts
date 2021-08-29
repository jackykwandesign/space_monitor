import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as serveIndex from 'serve-index';
import { AppModule } from './app.module';
import * as fs from 'fs'
import * as serveStatic from 'serve-static';

async function bootstrap() {

  const app = await NestFactory.create<NestExpressApplication>(
  AppModule,
  );
  const shareDir = join(__dirname, '../public')
  if(!fs.existsSync(shareDir)){
    fs.mkdirSync(shareDir, { recursive: true })
  }
  app.use('/public', serveIndex(shareDir, {
    'icons': true,
    view:"details"
  }));
  app.use('/public', serveStatic(shareDir, {
    maxAge: '1d',
    extensions: ['jpg', 'jpeg', 'png', 'gif','csv'],
  }));

  await app.listen(9001);

}
bootstrap();
