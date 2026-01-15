import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Глобальная валидация (проверка DTO)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // удаляет лишние поля, не описанные в DTO
      forbidNonWhitelisted: true, // выбрасывает ошибку, если есть лишние поля
      transform: true, // автоматически преобразует типы (string -> number и т.д.)
      transformOptions: {
        enableImplicitConversion: true, // автоматическая конвертация типов
      },
    }),
  );

  // Настройка CORS
  app.enableCors({
    origin: 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Настройка Swagger
  const config = new DocumentBuilder()
    .setTitle('Hackathon Ideas API')
    .setDescription('API для платформы хакатонов и идей')
    .setVersion('1.0')
    .addBearerAuth() // Для JWT авторизации
    .addTag('auth', 'Аутентификация')
    .addTag('users', 'Пользователи')
    .addTag('ideas', 'Идеи')
    .addTag('hackathons', 'Хакатоны')
    .addTag('comments', 'Комментарии')
    .addTag('votes', 'Голосования')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Hackathon API Docs',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    customCss: `
      .topbar-wrapper img {content:url('https://nestjs.com/img/logo-small.svg'); width:60px; height:auto;}
      .swagger-ui .topbar { background-color: #4a148c; }
      .swagger-ui .info .title { color: #4a148c; }
    `,
  });

  await app.listen(3001);
  
  console.log(`🚀 Приложение запущено на http://localhost:3001`);
  console.log(`📚 Swagger документация доступна на http://localhost:3001/api/docs`);
  console.log(`✅ Глобальная валидация включена`);
}
bootstrap();