import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { json, urlencoded } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import appMetadata from './app-metadata/app-metadata';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
<<<<<<< HEAD
    .setTitle('Pastor_lili API')
    .setVersion('1.0')
<<<<<<< HEAD
=======
    .addBearerAuth({
      type:"http",
      scheme:"bearer",
      bearerFormat:"JWT",
    },
    "JWT-auth",
  )
=======
    .setTitle(appMetadata.displayName)
    .setDescription(appMetadata.description)
    .setVersion(appMetadata.version)
>>>>>>> main
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'JWT-auth',
    )
<<<<<<< HEAD
=======
>>>>>>> 629848a8c4a818746ebc8de9471216be75e51fe6
>>>>>>> main
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
<<<<<<< HEAD
    swaggerOptions: {
      persistAuthorization: true,
    },
=======
<<<<<<< HEAD
    swaggerOptions:{
      persistAuthorization: true,
    }
=======
    swaggerOptions: {
      persistAuthorization: true,
    },
>>>>>>> 629848a8c4a818746ebc8de9471216be75e51fe6
>>>>>>> main
  });

  app.use(cookieParser());
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true }));
<<<<<<< HEAD
  app.enableCors('http://localhost:3001');
=======
<<<<<<< HEAD
  app.enableCors("http://localhost:3001");
=======
  app.enableCors('http://localhost:3001');
>>>>>>> 629848a8c4a818746ebc8de9471216be75e51fe6
>>>>>>> main

  // Make raw body available for the Stripe webhook route
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.post(
    '/bookings/webhook',
    express.raw({ type: 'application/json' }),
  );

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
