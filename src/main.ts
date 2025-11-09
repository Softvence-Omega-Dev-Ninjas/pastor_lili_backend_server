import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { json, urlencoded } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import appMetadata from './app-metadata/app-metadata';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      'http://localhost:5177',
      'https://pastorlili-dashboard.vercel.app',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

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

  app.use(cookieParser());
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true }));

  // Make raw body available for the Stripe webhook route
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.post(
    '/bookings/webhook',
    express.raw({ type: 'application/json' }),
  );

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
