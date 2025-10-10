import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { json, urlencoded } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('Pastor_lili API')
    .setVersion('1.0')
    .addBearerAuth({
      type:"http",
      scheme:"bearer",
      bearerFormat:"JWT",
    },
    "JWT-auth",
  )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions:{
      persistAuthorization: true,
    }
  });

  app.use(cookieParser());
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true }));
  app.enableCors("http://localhost:3001");

  // Make raw body available for the Stripe webhook route
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.post('/bookings/webhook', express.raw({ type: 'application/json' }));

  await app.listen(process.env.PORT || 3000);

}
bootstrap();
