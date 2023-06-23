import { Container } from 'typedi';
import {
  Controller, QueryParam, CurrentUser, Param, Body, Post, Put, Delete, Get, UseBefore, Req, UseAfter
} from 'routing-controllers';
import { AuthUser } from '@prisma/client';
import passport from 'passport';
import { RoleService } from '../services/role.service';
import { PermissionService } from '../services/permission.service';
import BadRequest from '../errors/bad-request';
import AuthAuditMiddleware from '../middlewares/authAudit.middleware';
import ResourceIdMiddleware from '../middlewares/resourceId.middleware';
import { PrismaErrorHandler } from '../errors/prismaErrorHandler';

interface customRequest extends Request{
  auditTrail: string
}

@Controller('/roles')
@UseBefore(passport.authenticate('jwt', { session: false }), ResourceIdMiddleware)
@UseAfter(AuthAuditMiddleware)
export class RoleController {
  constructor(
        private readonly roleService: RoleService = Container.get(RoleService),
        private readonly permissionService: PermissionService = Container.get(PermissionService),
        private readonly prismaErrorHandler: PrismaErrorHandler = Container.get(PrismaErrorHandler)
  ) {}

  @Post('/create')
  async create(@Req() req: customRequest, @Body() role: any, @CurrentUser() user: AuthUser, @QueryParam('resourceId') resourceId: string) {
    const { roleId } = user;

    if (!roleId) {
      throw new BadRequest('You have not been assigned a role');
    }

    const canCreate = await this.permissionService.canView(roleId, resourceId);
    if (!canCreate) {
      throw new BadRequest('You are not allowed to create a role', 403);
    }

    let newRole;

    try {
      newRole = await this.roleService.create(role);
    } catch (error) {
      return this.prismaErrorHandler.handle(error);
    }

    req.auditTrail = `created role: ${newRole.name}`;
    return newRole;
  }

  @Put('/update/:id')
  async update(@Req() req:any, @Param('id') id: number, @Body() role: any, @CurrentUser() user: AuthUser, @QueryParam('resourceId') resourceId: string) {
    const { roleId } = user;

    if (!roleId) {
      throw new BadRequest('You have not been assigned a role');
    }

    const canUpdate = await this.permissionService.canUpdate(roleId, resourceId);
    if (!canUpdate) {
      throw new BadRequest('Forbidden', 403);
    }

    req.auditTrail = `updated role: ${id}, update: ${role}`;

    let updatedRole;
    try {
      updatedRole = await this.roleService.update(id, role);
    } catch (error) {
      console.log(error);
      return this.prismaErrorHandler.handle(error);
    }

    req.auditTrail = `updated role: ${updatedRole.name}, update: ${JSON.stringify(role)} `;
    return updatedRole;
  }

  @Delete('/delete/:id')
  async delete(@Req() req: customRequest, @Param('id') id: number, @CurrentUser() user: AuthUser, @QueryParam('resourceId') resourceId: string) {
    const { roleId } = user;

    if (!roleId) {
      throw new BadRequest('You have not been assigned a role');
    }

    const canDelete = await this.permissionService.canDelete(roleId, resourceId);
    if (!canDelete) {
      throw new BadRequest('Forbidden', 403);
    }

    let deletedRole;
    try {
      deletedRole = await this.roleService.delete(id);
    } catch (error) {
      return this.prismaErrorHandler.handle(error);
    }

    req.auditTrail = `deleted role: ${deletedRole.name}`;
    return deletedRole;
  }

  @Get('/')
  async getAll(@CurrentUser() user: AuthUser, @QueryParam('resourceId') resourceId: string) {
    const { roleId } = user;

    if (!roleId) {
      throw new BadRequest('You have not been assigned a role');
    }

    const canView = await this.permissionService.canView(roleId, resourceId);
    if (!canView) {
      throw new BadRequest('Forbidden', 403);
    }

    try {
      return await this.roleService.getAll();
    } catch (error) {
      return this.prismaErrorHandler.handle(error);
    }
  }

  @Get('/:id')
  async getOne(@Param('id') id: number, @CurrentUser() user: AuthUser, @QueryParam('resourceId') resourceId: string) {
    const { roleId } = user;

    if (!roleId) {
      throw new BadRequest('You have not been assigned a role');
    }

    const canView = await this.permissionService.canView(roleId, resourceId);
    if (!canView) {
      throw new BadRequest('Forbidden', 403);
    }

    try {
      return await this.roleService.getOne(id);
    } catch (error) {
      return this.prismaErrorHandler.handle(error);
    }
  }
}

// In the above class, each method checks if the current user's role has the permission to carry out the activity before proceeding.
// If the user is not permitted, an error is thrown.
