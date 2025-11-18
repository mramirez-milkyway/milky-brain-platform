import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePolicyDto } from './dto/policy.dto';

@Injectable()
export class PoliciesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.policy.findMany();
  }

  async create(createDto: CreatePolicyDto) {
    return this.prisma.policy.create({
      data: createDto,
    });
  }
}
