import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { InviteUserDto, UpdateUserDto } from './dto/user.dto'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        lastSeenAt: true,
        createdAt: true,
      },
    })
  }

  async findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        lastSeenAt: true,
        createdAt: true,
      },
    })
  }

  async invite(inviteDto: InviteUserDto) {
    const user = await this.prisma.user.create({
      data: {
        email: inviteDto.email,
        name: inviteDto.name || inviteDto.email,
        status: 'INVITED',
      },
    })

    // Assign role if provided
    if (inviteDto.roleId) {
      await this.assignRole(user.id, inviteDto.roleId)
    }

    return user
  }

  async update(id: number, updateDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: updateDto,
    })
  }

  async deactivate(id: number) {
    return this.prisma.user.update({
      where: { id },
      data: { status: 'DEACTIVATED' },
    })
  }

  async getUserRoles(userId: number) {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    })
    return userRoles.map(
      (ur: {
        role: {
          id: number
          name: string
          description: string | null
          createdAt: Date
          updatedAt: Date
        }
      }) => ur.role
    )
  }

  async assignRole(userId: number, roleId: number) {
    return this.prisma.userRole.create({
      data: { userId, roleId },
    })
  }

  async removeRole(userId: number, roleId: number) {
    return this.prisma.userRole.deleteMany({
      where: { userId, roleId },
    })
  }
}
