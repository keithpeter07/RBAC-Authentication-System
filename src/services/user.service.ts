import { Service } from 'typedi';
import {
  Prisma as PrismaClient, AuthUser, Password, UserRoles
} from '@prisma/client';
import prisma from '../prisma';

@Service()
export class UserService {
  public async getAll(): Promise<AuthUser[]> {
    return prisma.authUser.findMany({
      include: {
        role: { select: { name: true } }
      }
    });
  }

  async getOne(id: string): Promise<AuthUser | null> {
    return prisma.authUser.findUnique({
      where: {
        id
      },
      include: {
        role: { select: { name: true } }
      }
    });
  }

  async getByEmail(email: string): Promise<AuthUser | null> {
    return prisma.authUser.findUnique({
      where: {
        email
      },
      include: {
        role: { select: { name: true } }
      }
    });
  }

  async create(data: PrismaClient.AuthUserCreateInput): Promise<AuthUser> {
    return prisma.authUser.create({
      data
    });
  }

  async update(id: string, data: PrismaClient.AuthUserUpdateInput): Promise<AuthUser> {
    return prisma.authUser.update({
      where: {
        id
      },
      data,
      include: {
        role: {
          select: {
            name: true
          }
        }
      }
    });
  }

  async delete(id: string): Promise<AuthUser> {
    return prisma.authUser.delete({
      where: {
        id
      }
    });
  }

  async getPassword(id: string): Promise<Password | null> {
    return prisma.password.findUnique({
      where: {
        userId: id
      }
    });
  }

  async createPassword(id: string, hash:string): Promise<Password> {
    return prisma.password.create({
      data: {
        userId: id,
        hash
      }
    });
  }

  async getAuthUserRoles(id: string): Promise<UserRoles[]> {
    return prisma.userRoles.findMany({
      where: {
        userId: id
      },
      include: {
        role: true
      }
    });
  }
}
