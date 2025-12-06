import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobsRepository } from './jobs.repository';
import { S3Service } from '../common/services/s3.service';
import { SqsService } from '../common/services/sqs.service';
import { RbacService } from '../common/services/rbac.service';

/**
 * Generic jobs module
 * Design: Self-contained, loosely coupled, extensible
 *
 * Exports JobsService and JobsRepository for use by other modules
 * if they need to interact with jobs programmatically
 */
@Module({
  controllers: [JobsController],
  providers: [
    JobsService,
    JobsRepository,
    S3Service,
    SqsService,
    RbacService,
    PrismaClient,
  ],
  exports: [JobsService, JobsRepository],
})
export class JobsModule {}
