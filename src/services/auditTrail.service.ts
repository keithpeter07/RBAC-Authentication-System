import { Service } from 'typedi';
import { AuthAuditTrail } from '@prisma/client';
import prisma from '../prisma';

@Service()
export class AuditTrailService {
  public async getAll(): Promise<AuthAuditTrail[]> {
    return prisma.authAuditTrail.findMany();
  }

  async create(data: any): Promise<AuthAuditTrail> {
    return prisma.authAuditTrail.create({
      data
    });
  }
}
