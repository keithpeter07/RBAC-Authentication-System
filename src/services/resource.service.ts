import { AuthResource, Prisma as PrismaClient } from '@prisma/client';
import Container, { Service } from 'typedi';
import prisma from '../prisma';
import { PermissionService } from './permission.service';

@Service()
export class ResourceService {
  constructor(
    private readonly permissionService = Container.get(PermissionService)
  ) {}

  async create(data: PrismaClient.AuthResourceCreateInput): Promise<AuthResource> {
    return prisma.authResource.create({
      data
    });
  }

  async getAll(): Promise<AuthResource[]> {
    return prisma.authResource.findMany();
  }

  async getMenuResources(roleId: number): Promise<AuthResource[]> {
    const viewableResourceId: string[] = await this.permissionService.getViewableResourceId(roleId);

    return prisma.authResource.findMany({
      where: {
        id: {
          in: viewableResourceId
        }
      }
    });
  }

  async getOne(id: string): Promise<AuthResource | null> {
    return prisma.authResource.findUnique({
      where: { id }
    });
  }

  async delete(id: string): Promise<AuthResource> {
    return prisma.authResource.delete({
      where: { id }
    });
  }

  async update(id: string, data: PrismaClient.AuthUserUpdateInput): Promise<AuthResource> {
    return prisma.authResource.update({
      where: { id },
      data
    });
  }
}
