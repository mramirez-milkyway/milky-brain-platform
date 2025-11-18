import { Injectable } from '@nestjs/common';
import { RbacService } from '../common/services/rbac.service';

@Injectable()
export class NavigationService {
  constructor(private rbacService: RbacService) {}

  async getNavigationForUser(userId: number) {
    const allNavItems = [
      { id: 'dashboard', label: 'Dashboard', path: '/', permission: null },
      { id: 'users', label: 'Users', path: '/users', permission: 'user:Read' },
      { id: 'roles', label: 'Roles', path: '/roles', permission: 'role:Read' },
      { id: 'policies', label: 'Policies', path: '/policies', permission: 'policy:Read' },
      { id: 'settings', label: 'Settings', path: '/settings', permission: 'settings:Read' },
      { id: 'audit', label: 'Audit Log', path: '/audit', permission: 'audit:Read' },
      { id: 'notifications', label: 'Notifications', path: '/notifications', permission: null },
    ];

    const navItems = [];
    for (const item of allNavItems) {
      if (!item.permission) {
        navItems.push(item);
      } else {
        const hasPermission = await this.rbacService.checkPermission(
          userId,
          item.permission,
          'res:*',
        );
        if (hasPermission) {
          navItems.push(item);
        }
      }
    }

    return navItems;
  }
}
