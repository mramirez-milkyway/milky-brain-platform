import { Injectable, ConflictException } from '@nestjs/common'
import { Agency } from '@prisma/client'
import { AgenciesRepository } from './agencies.repository'

export interface AgencyDto {
  id: number
  name: string
}

@Injectable()
export class AgenciesService {
  constructor(private readonly agenciesRepository: AgenciesRepository) {}

  /**
   * Get all agencies
   */
  async findAll(): Promise<AgencyDto[]> {
    const agencies = await this.agenciesRepository.findAll()
    return agencies.map(this.mapToDto)
  }

  /**
   * Search agencies by name
   */
  async search(query: string): Promise<AgencyDto[]> {
    const agencies = await this.agenciesRepository.search(query)
    return agencies.map(this.mapToDto)
  }

  /**
   * Create a new agency
   * Returns existing agency if name already exists (case-insensitive)
   */
  async create(name: string): Promise<AgencyDto> {
    const trimmedName = name.trim()

    if (!trimmedName) {
      throw new ConflictException('Agency name cannot be empty')
    }

    // Check if agency already exists
    const existing = await this.agenciesRepository.findByName(trimmedName)
    if (existing) {
      return this.mapToDto(existing)
    }

    const agency = await this.agenciesRepository.create(trimmedName)
    return this.mapToDto(agency)
  }

  /**
   * Find or create an agency by name
   */
  async findOrCreate(name: string): Promise<AgencyDto> {
    return this.create(name)
  }

  private mapToDto(agency: Agency): AgencyDto {
    return {
      id: agency.id,
      name: agency.name,
    }
  }
}
