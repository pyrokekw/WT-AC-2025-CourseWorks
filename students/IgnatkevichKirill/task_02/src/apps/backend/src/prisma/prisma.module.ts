// src/prisma/prisma.module.ts
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // ← теперь глобальный на уровне модуля
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // ← обязательно экспортируем!
})
export class PrismaModule {}