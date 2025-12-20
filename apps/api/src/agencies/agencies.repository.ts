import { Injectable } from '@nestjs/common'
import { PrismaClient, Agency } from '@prisma/client'

@Injectable()
export class AgenciesRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Find all agencies (non-deleted)
   */
  async findAll(): Promise<Agency[]> {
    return this.prisma.agency.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
    })
  }

  /**
   * Find agency by ID
   */
  async findById(id: number): Promise<Agency | null> {
    return this.prisma.agency.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    })
  }

  /**
   * Find agency by name (case-insensitive)
   */
  async findByName(name: string): Promise<Agency | null> {
    return this.prisma.agency.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        deletedAt: null,
      },
    })
  }

  /**
   * Create a new agency
   */
  async create(name: string): Promise<Agency> {
    return this.prisma.agency.create({
      data: {
        name,
      },
    })
  }

  /**
   * Search agencies by name (partial match)
   */
  async search(query: string): Promise<Agency[]> {
    return this.prisma.agency.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
      take: 20,
    })
  }
}
