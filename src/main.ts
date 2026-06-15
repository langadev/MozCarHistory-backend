import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

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
