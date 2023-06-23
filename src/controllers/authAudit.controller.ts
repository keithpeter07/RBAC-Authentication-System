import {
  Controller, CurrentUser, Get, QueryParam, UseBefore
} from 'routing-controllers';
import Container from 'typedi';
import passport from 'passport';
import { AuditTrailService } from '../services/auditTrail.service';
import BadRequest from '../errors/bad-request';
import { PermissionService } from '../services/permission.service';
import { PrismaErrorHandler } from '../errors/prismaErrorHandler';

@Controller('/auditTrail')
@UseBefore(passport.authenticate('jwt', { session: false }))
export class AuthAuditTrailController {
  constructor(
        private readonly authAuditService = Container.get(AuditTrailService),
        private readonly permissionService = Container.get(PermissionService),
        private readonly prismaErrorHandler = Container.get(PrismaErrorHandler)
  ) {}

    @Get('/')
  async getAll(@CurrentUser() user: any, @QueryParam('resourceId', { required: true }) resourceId: string) {
    const { roleId } = user;

    if (!roleId) {
      throw new BadRequest('You have not been assigned a role.');
    }

    const canView = await this.permissionService.canView(roleId, resourceId);
    if (!canView) {
      throw new BadRequest('Forbidden', 403);
    }

    try {
      return await this.authAuditService.getAll();
    } catch (error) {
      return this.prismaErrorHandler.handle(error);
    }
  }
}
