import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import * as crypto from 'crypto'

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    actorId: number
    action: string
    entityType: string
    entityId?: string
    beforeState?: any
    afterState?: any
    ipAddress?: string
    userAgent?: string
  }) {
    // Get previous hash for chain
    const lastEvent = await this.prisma.auditEvent.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    const prevHash = lastEvent?.hash || null

    // Compute hash
    const hash = this.computeHash({
      ...params,
      prevHash,
      timestamp: new Date().toISOString(),
    })

    return this.prisma.auditEvent.create({
      data: {
        ...params,
        hash,
        prevHash,
      },
    })
  }

  private computeHash(data: any): string {
    const hash = crypto.createHash('sha256')
    hash.update(JSON.stringify(data))
    return hash.digest('hex')
  }

  generateDescription(event: any): string {
    const actorName = event.actor?.name || `User ${event.actorId}`
    const actionParts = event.action?.split(' ') || []
    const method = actionParts[0] || ''
    const path = actionParts[1] || ''
    const entityType = event.entityType
    const entityId = event.entityId

    // Handle sensitive operations
    if (path?.includes('/password') || event.beforeState?.password || event.afterState?.password) {
      return `${actorName} changed their password`
    }

    // POST operations (Create)
    if (method === 'POST') {
      if (path?.includes('/invite')) {
        const email = event.beforeState?.email || event.afterState?.email
        return email ? `${actorName} invited ${email}` : `${actorName} invited a new user`
      }
      if (path?.includes('/roles') && entityId) {
        return `${actorName} assigned a role to user ${entityId}`
      }
      const targetEmail = event.beforeState?.email || event.afterState?.email
      const targetName = event.beforeState?.name || event.afterState?.name
      if (targetEmail) {
        return `${actorName} created ${entityType} ${targetName || targetEmail}`
      }
      return `${actorName} created a new ${entityType}`
    }

    // PATCH operations (Update)
    if (method === 'PATCH' || method === 'PUT') {
      // Role changes
      if (path?.includes('/roles') && event.beforeState && event.afterState) {
        const oldRole = event.beforeState.name
        const newRole = event.afterState.name
        if (oldRole && newRole && oldRole !== newRole) {
          return `${actorName} changed role from "${oldRole}" to "${newRole}"`
        }
      }

      // Status changes
      if (event.beforeState?.status && event.afterState?.status) {
        const oldStatus = event.beforeState.status
        const newStatus = event.afterState.status
        if (oldStatus !== newStatus) {
          return `${actorName} changed ${entityType} status from "${oldStatus}" to "${newStatus}"`
        }
      }

      // Generic update
      const changes = this.getChangedFields(event.beforeState, event.afterState)
      if (changes.length > 0) {
        const changedFieldsList = changes.join(', ')
        return `${actorName} updated ${entityType}${entityId ? ` #${entityId}` : ''} (changed: ${changedFieldsList})`
      }

      return `${actorName} updated ${entityType}${entityId ? ` #${entityId}` : ''}`
    }

    // DELETE operations
    if (method === 'DELETE') {
      if (path?.includes('/roles') && path.split('/').length > 4) {
        return `${actorName} removed a role from user ${entityId}`
      }
      return `${actorName} deleted ${entityType}${entityId ? ` #${entityId}` : ''}`
    }

    // GET operations
    if (method === 'GET') {
      if (path?.includes('/export')) {
        return `${actorName} exported ${entityType} data`
      }
      return `${actorName} viewed ${entityType}${entityId ? ` #${entityId}` : ' list'}`
    }

    // Fallback
    return `${actorName} performed ${method} on ${entityType}`
  }

  private getChangedFields(before: any, after: any): string[] {
    if (!before || !after) return []

    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'accessToken']
    const changes: string[] = []

    // Compare fields
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])

    for (const key of allKeys) {
      if (sensitiveFields.includes(key)) {
        continue // Skip sensitive fields
      }

      const beforeVal = before[key]
      const afterVal = after[key]

      if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
        changes.push(key)
      }
    }

    return changes
  }

  async searchEvents(params: {
    actorId?: number
    action?: string
    entityType?: string
    startDate?: Date
    endDate?: Date
    limit?: number
  }) {
    // Build where clause dynamically
    const where: any = {}

    if (params.actorId) {
      where.actorId = params.actorId
    }

    if (params.action) {
      where.action = params.action
    }

    if (params.entityType) {
      where.entityType = params.entityType
    }

    // Add date range filter
    if (params.startDate || params.endDate) {
      where.createdAt = {}

      if (params.startDate) {
        where.createdAt.gte = params.startDate
      }

      if (params.endDate) {
        where.createdAt.lte = params.endDate
      }
    }

    // Enforce maximum limit of 1000
    const limit = Math.min(params.limit || 100, 1000)

    return this.prisma.auditEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }
}
