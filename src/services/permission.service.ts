import { AuthPermission, AuthResource, Prisma as PrismaClient } from '@prisma/client';
import { Service } from 'typedi';
import prisma from '../prisma';

@Service()
export class PermissionService {
  async getAll() {
    return prisma.authPermission.findMany();
  }

  async getOne(roleId: number, resourceId: string): Promise<AuthPermission | null> {
    return prisma.authPermission.findFirst({
      where: {
        roleId,
        resourceId
      }
    });
  }

  async create(data: PrismaClient.AuthPermissionCreateInput): Promise<AuthPermission> {
    return prisma.authPermission.create({
      data
    });
  }

  async createMany(data: PrismaClient.AuthPermissionCreateManyInput): Promise<PrismaClient.BatchPayload> {
    return prisma.authPermission.createMany({
      data
    });
  }

  async updateMany(id: number, data: AuthPermission[]): Promise<AuthPermission[]> {
    const updates = data.map(permissionUpdate => prisma.authPermission.update({
      where: { id: permissionUpdate.id },
      data: {
        canView: permissionUpdate.canView,
        canCreate: permissionUpdate.canCreate,
        canUpdate: permissionUpdate.canUpdate,
        canExecute: permissionUpdate.canExecute,
        canDelete: permissionUpdate.canDelete
      }
    }));

    return prisma.$transaction(updates);
  }

  async delete(id: number): Promise<AuthPermission> {
    return prisma.authPermission.delete({
      where: { id }
    });
  }

  async getViewableResourceId(roleId: number): Promise<string[]> {
    return prisma.authPermission.findMany({
      where: {
        roleId,
        canView: true
      }
    }).then(permissions => permissions.map(permission => permission.resourceId));
  }

  async getRolePermissions(roleId: number): Promise<AuthPermission[]> {
    return prisma.authPermission.findMany({
      where: { roleId },
      include: {
        resource: {
          select: {
            name: true
          }
        }
      }
    });
  }

  async getResourceIdsWithPermissions(roleId: number): Promise<string[]> {
    const permissions = await prisma.authPermission.findMany({
      where: { roleId }
    });

    return permissions.map(permission => permission.resourceId);
  }

  async getResourcesWithoutPermissions(resourceIdsWithPermissions: string[]): Promise<AuthResource[]> {
    return prisma.authResource.findMany({
      where: {
        NOT: {
          id: { in: resourceIdsWithPermissions }
        }
      }
    });
  }

  // The methods below check specific permissions, for specific roles, on specific resources
  // Example: if an 'ADMIN' can 'VIEW' a 'USER'
  async canCreate(roleId: number, resourceId: string): Promise<boolean> {
    const permission = await this.getOne(roleId, resourceId);
    return permission?.canCreate || false;
  }

  async canView(roleId: number, resourceId: string): Promise<boolean> {
    const permission = await this.getOne(roleId, resourceId);
    return permission?.canView || false;
  }

  async canUpdate(roleId: number, resourceId: string): Promise<boolean> {
    const permission = await this.getOne(roleId, resourceId);
    return permission?.canUpdate || false;
  }

  async canDelete(roleId: number, resourceId: string): Promise<boolean> {
    const permission = await this.getOne(roleId, resourceId);
    return permission?.canDelete || false;
  }

  async canExecute(roleId: number, resourceId: string): Promise<boolean> {
    const permission = await this.getOne(roleId, resourceId);
    return permission?.canExecute || false;
  }
}
