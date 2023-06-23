import {
  Controller, CurrentUser, Get, Param, QueryParam, Put, UseBefore, Body, Req, Post, UseAfter
} from 'routing-controllers';
import Container from 'typedi';
import { AuthUser } from '@prisma/client';
import passport from 'passport';
import { PermissionService } from '../services/permission.service';
import { PrismaErrorHandler } from '../errors/prismaErrorHandler';
import BadRequest from '../errors/bad-request';
import AuthAuditMiddleware from '../middlewares/authAudit.middleware';

interface customRequest extends Request{
  authAudit: string
}

@Controller('/permissions')
@UseBefore(passport.authenticate('jwt', { session: false }))
@UseAfter(AuthAuditMiddleware)
export class PermissionController {
  constructor(
        private readonly permissionService: PermissionService = Container.get(PermissionService),
        private readonly prismaErrorHandler: PrismaErrorHandler = Container.get(PrismaErrorHandler)
  ) {}

  @Get('/newresources/:id')
  async getNewReources(@Param('id') id: number, @CurrentUser() user: AuthUser, @QueryParam('resourceId') resourceId: string) {
    const { roleId } = user;

    if (!roleId) {
      throw new BadRequest('You have not been assigned a role');
    }

    const canView = await this.permissionService.canView(roleId, resourceId);
    if (!canView) {
      throw new BadRequest('You are not allowed to view roles');
    }

    let resourceIdsWithPermissions: string[];
    try {
      resourceIdsWithPermissions = await this.permissionService.getResourceIdsWithPermissions(id);
    } catch (error) {
      return this.prismaErrorHandler.handle(error);
    }

    if (resourceIdsWithPermissions.length === 0) {
      return [];
    }

    try {
      return await this.permissionService.getResourcesWithoutPermissions(resourceIdsWithPermissions);
    } catch (error) {
      return this.prismaErrorHandler.handle(error);
    }
  }

    @Get('/:id')
  async getRolePermissions(@Param('id') id: number, @CurrentUser() user: AuthUser, @QueryParam('resourceId') resourceId: string) {
    const { roleId } = user;

    if (!roleId) {
      throw new BadRequest('You have not been assigned a role');
    }

    const canView = await this.permissionService.canView(roleId, resourceId);
    if (!canView) {
      throw new BadRequest('Forbidden', 403);
    }

    try {
      return await this.permissionService.getRolePermissions(id);
    } catch (error) {
      return this.prismaErrorHandler.handle(error);
    }
  }

  @Post('/create/:id')
    async createManyPermissions(@Param('id') id: number, @Req() req: customRequest, @Body() permissions: any, @CurrentUser() user: AuthUser, @QueryParam('resourceId') resourceId: string) {
      const { roleId } = user;

      if (!roleId) {
        throw new BadRequest('You have not been assigned a role');
      }

      const canCreate = await this.permissionService.canUpdate(roleId, resourceId);
      if (!canCreate) {
        throw new BadRequest('You are not allowed to create new permissions', 403);
      }

      let createdPermissions;
      try {
        createdPermissions = await this.permissionService.createMany(permissions);
      } catch (error) {
        return this.prismaErrorHandler.handle(error);
      }

      req.authAudit = `created new permissions, roleId: ${id}, permissions: ${JSON.stringify(permissions)}`;
      return createdPermissions;
    }

  @Put('/update/:id')
  async update(@Param('id') id: number, @Req() req: customRequest, @CurrentUser() user: AuthUser, @QueryParam('resourceId') resourceId: string, @Body() updates: any[]) {
    const { roleId } = user;

    if (!roleId) {
      throw new BadRequest('You have not been assigned a role');
    }

    // Checks whether you can update roles, so as to view permissions
    const canView = await this.permissionService.canUpdate(roleId, resourceId);
    if (!canView) {
      throw new BadRequest('Forbidden', 403);
    }

    let updatedPermissions;
    try {
      updatedPermissions = await this.permissionService.updateMany(id, updates);
    } catch (error) {
      return this.prismaErrorHandler.handle(error);
    }

    req.authAudit = `updated role, roleId: ${id}, update: ${JSON.stringify(updates)}`;
    return updatedPermissions;
  }
}
