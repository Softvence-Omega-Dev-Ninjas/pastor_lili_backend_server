import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { json, urlencoded } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import appMetadata from './app-metadata/app-metadata';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle(appMetadata.displayName)
    .setDescription(appMetadata.description)
    .setVersion(appMetadata.version)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // ✅ STEP 1: Raw body first (for Stripe webhook)
  app.use('/bookings/webhook', bodyParser.raw({ type: 'application/json' }));

  // ✅ STEP 2: Normal parsers for all other routes
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true }));

  app.enableCors({ origin: 'http://localhost:3001' });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
