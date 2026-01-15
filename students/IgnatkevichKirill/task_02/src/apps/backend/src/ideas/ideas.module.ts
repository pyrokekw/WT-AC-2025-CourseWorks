import { Module } from '@nestjs/common';
import { IdeasService } from './ideas.service';
import { IdeasController } from './ideas.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [IdeasService, PrismaService],
  controllers: [IdeasController]
})
export class IdeasModule {}
