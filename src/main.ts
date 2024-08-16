import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import * as basicAuth from 'express-basic-auth';

import { AppModule } from '@/app/app.module';
import { GlobalExceptionFilter } from '@/app/filters';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const port = process.env.APP_PORT || 5000;

  /**
   * Global configuration
   */
  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  app.use(compression());

  app.use(helmet({ contentSecurityPolicy: false }));

  app.enableCors({
    origin: '*',
  });

  /**
   * Global filters
   */
  app.useGlobalFilters(new GlobalExceptionFilter());

  if (process.env.APP_ENV === 'dev') {
    /**
     * Require login to view api documentation in production env
     */
    app.use(
      ['/docs'],
      basicAuth({
        challenge: true,
        users: {
          admin: 'admin',
        },
      }),
    );
  }

  /**
   * Swagger configuration
   */
  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('Automatically generated API documentation')
    .setVersion('1.0')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs/api', app, swaggerDocument, {
    customSiteTitle: 'PBAR Server API Documentation',
  });

  await app.listen(port);
}

bootstrap();
