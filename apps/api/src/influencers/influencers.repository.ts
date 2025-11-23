import { Injectable } from '@nestjs/common'
import { PrismaClient, Influencer } from '@prisma/client'

@Injectable()
export class InfluencersRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(limit?: number, offset = 0): Promise<Influencer[]> {
    return this.prisma.influencer.findMany({
      take: limit,
      skip: offset,
      orderBy: {
        followers: 'desc',
      },
    })
  }

  async count(): Promise<number> {
    return this.prisma.influencer.count()
  }

  async findById(id: number): Promise<Influencer | null> {
    return this.prisma.influencer.findUnique({
      where: { id },
    })
  }
}
