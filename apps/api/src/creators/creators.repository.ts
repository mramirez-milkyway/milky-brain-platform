import { Injectable } from '@nestjs/common'
import { PrismaClient, Creator, CreatorSocial } from '@prisma/client'

export type CreatorWithSocials = Creator & {
  creatorSocials: CreatorSocial[]
}

@Injectable()
export class CreatorsRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(limit?: number, offset = 0): Promise<CreatorWithSocials[]> {
    return this.prisma.creator.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        creatorSocials: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            followers: 'desc',
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: {
        fullName: 'asc',
      },
    })
  }

  async count(): Promise<number> {
    return this.prisma.creator.count({
      where: {
        deletedAt: null,
      },
    })
  }

  async findById(id: number): Promise<CreatorWithSocials | null> {
    return this.prisma.creator.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        creatorSocials: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            followers: 'desc',
          },
        },
      },
    })
  }
}
