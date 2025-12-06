import { JobStatus } from '@prisma/client';

export class JobResponseDto {
  id: number;
  taskId: string;
  jobType: string;
  status: JobStatus;
  queue: string;
  attempts: number;
  maxAttempts: number;
  errorReason: string | null;
  fileName: string | null;
  payload: unknown;
  result: unknown;
  meta: unknown;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
