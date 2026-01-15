import { Module } from '@nestjs/common';
import { HackathonsService } from './hackathons.service';
import { HackathonsController } from './hackathons.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [HackathonsController],
  providers: [HackathonsService, PrismaService],
})
export class HackathonsModule {}