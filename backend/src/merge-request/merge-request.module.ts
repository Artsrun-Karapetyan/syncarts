import { Module } from '@nestjs/common';
import { MergeRequestController } from './merge-request.controller';
import { MergeRequestService } from './merge-request.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MergeRequestController],
  providers: [MergeRequestService],
})
export class MergeRequestModule {}
