import { Prisma as PrismaClient, AuthRole } from '@prisma/client';
import { Service } from 'typedi';
import prisma from '../prisma';

@Service()
export class RoleService {
  async getOne(id: number): Promise<AuthRole | null> {
    return prisma.authRole.findUnique({
      where: { id }
    });
  }

  async getAll(): Promise<AuthRole[]> {
    return prisma.authRole.findMany();
  }

  async create(data: PrismaClient.AuthRoleCreateInput): Promise<AuthRole> {
    return prisma.authRole.create({
      data
    });
  }

  async update(id: number, data: PrismaClient.AuthRoleUpdateInput): Promise<AuthRole> {
    return prisma.authRole.update({
      where: { id },
      data
    });
  }

  async delete(id: number): Promise<AuthRole> {
    return prisma.authRole.delete({
      where: { id }
    });
  }
}
