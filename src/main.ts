import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // FRONTEND_URL can be a single URL or comma-separated list of allowed origins.
  // Example: https://moz-car-history-client.vercel.app,http://localhost:5173
  const rawOrigins = process.env.FRONTEND_URL ?? "";
  const allowedOrigins = rawOrigins
    .split(",")
    .map(o => o.trim())
    .filter(Boolean);

  // Always allow local dev origins so local builds keep working
  const devOrigins = ["http://localhost:5173", "http://localhost:8081", "http://localhost:4173"];
  const origins = [...new Set([...allowedOrigins, ...devOrigins])];

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, curl, Swagger)
      if (!origin) return callback(null, true);
      if (origins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('MozCarHistory API')
    .setDescription('API para registo e consulta de histórico de manutenção de viaturas em Moçambique')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticação e registo de utilizadores')
    .addTag('cars', 'Gestão de viaturas')
    .addTag('maintenance', 'Registos de manutenção')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
