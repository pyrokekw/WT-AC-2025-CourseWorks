// src/prisma/prisma.service.ts
import { Injectable, Global } from '@nestjs/common';
import prisma from './client'; 

@Global()
@Injectable()
export class PrismaService {
  readonly prisma = prisma;
  
  // Proxy методы для удобства
  get idea() {
    return this.prisma.idea;
  }
  
  get user() {
    return this.prisma.user;
  }
  
  get tag() {
    return this.prisma.tag;
  }
  
  get comment() {
    return this.prisma.comment;
  }
  
  get vote() {
    return this.prisma.vote;
  }
  
  // ДОБАВЛЯЕМ методы для хакатонов
  get hackathon() {
    return this.prisma.hackathon;
  }
  
  get hackathonIdea() {
    return this.prisma.hackathonIdea;
  }
  
  get hackathonParticipant() {
    return this.prisma.hackathonParticipant;
  }
}