import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany();
  }

  async create(createDto: CreateRoleDto) {
    return this.prisma.role.create({
      data: createDto,
    });
  }

  async update(id: number, updateDto: UpdateRoleDto) {
    return this.prisma.role.update({
      where: { id },
      data: updateDto,
    });
  }
}
