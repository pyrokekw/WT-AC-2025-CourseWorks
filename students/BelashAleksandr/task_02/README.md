# News Aggregator "Без фейков" (Вариант 37)

Агрегатор новостей с системой модерации жалоб. Курсовой проект по дисциплине «Веб-Технологии». Требования и материалы варианта 37 см. в каталоге `task_01/`.

## Технологический стек

### Backend

- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT (jsonwebtoken)
- Zod (валидация)
- bcrypt (хеширование паролей)
- Winston (логирование)

### Frontend

- React 18
- TypeScript
- React Router
- Zustand (state management)
- Axios
- Vite

### DevOps

- Docker + Docker Compose
- pnpm (package manager)

## Требования

- Node.js >= 18
- pnpm >= 8
- PostgreSQL 15+ (локально, без Docker для приёмки)

## Быстрый старт

### Локальный запуск (для приёмки)

1. Скопируйте переменные окружения для бэкенда и фронтенда:

 ```bash
 # Backend
 cp apps/server/.env.example apps/server/.env
 # Обязательно замените JWT_ACCESS_SECRET и JWT_REFRESH_SECRET на уникальные значения
 
 # Frontend
 cp apps/web/.env.example apps/web/.env
 ```

1. Поднимите PostgreSQL локально (порт 5432) и создайте базу `news_aggregator`.

1. Установите зависимости в монорепо:

 ```bash
 pnpm install
 ```

1. Примените Prisma схему и заполните тестовыми данными:

 ```bash
 cd apps/server
 pnpm db:generate
 pnpm db:push
 pnpm db:seed
 cd ../..
 ```

1. Запустите фронтенд и бэкенд из корня одной командой:

 ```bash
 pnpm dev
 ```

Frontend: <http://localhost:5173>, Backend API: <http://localhost:3000>.

### Docker Compose (опционально для локальной разработки)

Команды из предыдущей версии сохранены в `docker-compose.yml`, но для приёмки используйте локальную БД.

## Учетные записи по умолчанию

После выполнения seed будут созданы следующие пользователи:

- **Администратор**: `admin` / `admin123`
- **Модератор**: `moderator` / `moderator123`
- **Пользователь**: `user` / `user123`

Auth-flow: access-токен возвращается в ответе, refresh-токен выдаётся и ротируется в HttpOnly cookie (`/api/auth/refresh`).

## Функциональность

### Роли пользователей

#### Пользователь (user)

- Просмотр ленты новостей
- Фильтрация по тегам и источникам
- Просмотр детальной информации о статье
- Добавление/удаление статей в избранное
- Подача жалоб на статьи

#### Модератор (moderator)

- Все функции пользователя
- Просмотр списка жалоб
- Рассмотрение и закрытие жалоб
- Удаление статей по жалобам

#### Администратор (admin)

- Все функции модератора
- Управление пользователями (CRUD)
- Управление источниками (CRUD)
- Управление тегами (CRUD)

## API Endpoints

### Аутентификация

- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/refresh` - Обновление токена

### Пользователи

- `GET /api/users` - Список пользователей (admin)
- `GET /api/users/:id` - Получить пользователя
- `POST /api/users` - Создать пользователя (admin)
- `PUT /api/users/:id` - Обновить пользователя
- `DELETE /api/users/:id` - Удалить пользователя (admin)

### Источники

- `GET /api/sources` - Список источников
- `GET /api/sources/:id` - Получить источник
- `POST /api/sources` - Создать источник (admin)
- `PUT /api/sources/:id` - Обновить источник (admin)
- `DELETE /api/sources/:id` - Удалить источник (admin)

### Лента новостей

- `GET /api/feed` - Список статей (с фильтрами)
- `GET /api/feed/:id` - Получить статью

### Теги

- `GET /api/tags` - Список тегов
- `GET /api/tags/:id` - Получить тег
- `POST /api/tags` - Создать тег (admin)
- `PUT /api/tags/:id` - Обновить тег (admin)
- `DELETE /api/tags/:id` - Удалить тег (admin)

### Избранное

- `GET /api/favorites` - Список избранного (user)
- `POST /api/favorites` - Добавить в избранное (user)
- `DELETE /api/favorites/:id` - Удалить из избранного (user)

### Жалобы

- `GET /api/reports` - Список жалоб (admin/moderator)
- `GET /api/reports/:id` - Получить жалобу
- `POST /api/reports` - Создать жалобу (user)
- `PUT /api/reports/:id` - Обновить статус жалобы (admin/moderator)

## Разработка

### Линтинг

```bash
pnpm lint
```

### Форматирование

```bash
pnpm format
```

### База данных

#### Создание миграции

```bash
cd apps/server
pnpm prisma migrate dev --name migration_name
```

#### Открыть Prisma Studio

```bash
cd apps/server
pnpm db:studio
```

## Безопасность

- Пароли хешируются с использованием bcrypt
- JWT токены с ограниченным временем жизни
- CORS настроен для работы с клиентом
- Helmet для защиты HTTP заголовков
- Валидация всех входных данных (Zod)
- Защита маршрутов по ролям

## Лицензия

MIT
