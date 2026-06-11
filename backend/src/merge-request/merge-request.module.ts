import { Module } from '@nestjs/common';
import { MergeRequestController } from './merge-request.controller.js';
import { MergeRequestService } from './merge-request.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [MergeRequestController],
  providers: [MergeRequestService],
})
export class MergeRequestModule {}
