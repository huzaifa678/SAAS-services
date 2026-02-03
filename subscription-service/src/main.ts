import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.enableShutdownHooks();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  const port = process.env.PORT || 8081
  await app.listen(port);

  logger.log(`Subscription service running on port ${port}`);

  process.on('SIGINT', () => logger.log('SIGINT received'));
  process.on('SIGTERM', () => logger.log('SIGTERM received'));
}
bootstrap();
