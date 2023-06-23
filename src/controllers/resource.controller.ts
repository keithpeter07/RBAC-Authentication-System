import {
  Controller, Post, Body, Put, Param, Delete, Get, UseBefore, QueryParam, CurrentUser, UseAfter, Req
} from 'routing-controllers';
import Container from 'typedi';
import passport from 'passport';
import { AuthUser } from '@prisma/client';
import { ResourceService } from '../services/resource.service';
import { PermissionService } from '../services/permission.service';
import BadRequest from '../errors/bad-request';
import AuthAuditMiddleware from '../middlewares/authAudit.middleware';
import ResourceIdMiddleware from '../middlewares/resourceId.middleware';
import { PrismaErrorHandler } from '../errors/prismaErrorHandler';

interface customRequest extends Request{
  auditTrail: string
}

@Controller('/resources')
@UseBefore(passport.authenticate('jwt', { session: false }), ResourceIdMiddleware)
@UseAfter(AuthAuditMiddleware)
export class ResourceController {
  constructor(
        private readonly resourceService: ResourceService = Container.get(ResourceService),
        private readonly permissionService: PermissionService = Container.get(PermissionService),
        private readonly prismaErrorHandler: PrismaErrorHandler = Container.get(PrismaErrorHandler)
  ) {}

  @Post('/create')
  async create(@Req() req: customRequest, @Body() resource: any, @CurrentUser() user: AuthUser, @QueryParam('resourceId') resourceId: string) {
    const { roleId } = user;

    if (!roleId) {
      throw new BadRequest('You have not been assigned a role');
    }

    const canCreate = await this.permissionService.canCreate(roleId, resourceId);
    if (!canCreate) {
      throw new BadRequest('Forbidden', 403);
    }

    let createdResource;
    try {
      createdResource = await this.resourceService.create(resource);
    } catch (error) {
      return this.prismaErrorHandler.handle(error);
    }

    req.auditTrail = `created resource: ${createdResource.name}`;
    return createdResource;
  }

  @Put('/update/:id')
  async update(@Req() req: any, @Param('id') id: string, @Body() resource: any, @CurrentUser() user: AuthUser, @QueryParam('resourceId', { required: true }) resourceId: string) {
    const { roleId } = user;

    if (!roleId) {
      throw new BadRequest('You have not been assigned a role');
    }

    const canUpdate = await this.permissionService.canUpdate(roleId, resourceId);
    if (!canUpdate) {
      throw new BadRequest('You are not allowed to update resources', 403);
    }

    let updatedResource;
    try {
      updatedResource = await this.resourceService.update(id, resource);
    } catch (error) {
      return this.prismaErrorHandler.handle(error);
    }

    req.auditTrail = `updated resource: ${updatedResource.name}, update: ${JSON.stringify(resource)}`;
    return updatedResource;
  }

  @Delete('/delete/:id')
  async delete(@Req() req: customRequest, @Param('id') id: string, @CurrentUser() user: AuthUser, @QueryParam('resourceId', { required: true }) resourceId: string) {
    const { roleId } = user;

    if (!roleId) {
      throw new BadRequest('You have not been assigned a role');
    }

    const canDelete = await this.permissionService.canDelete(roleId, resourceId);
    if (!canDelete) {
      throw new BadRequest('Forbidden', 403);
    }

    let deletedResource;
    try {
      deletedResource = await this.resourceService.delete(id);
    } catch (error) {
      return this.prismaErrorHandler.handle(error);
    }

    req.auditTrail = `deleted resource: ${deletedResource.name}`;
    return deletedResource;
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
      return await this.resourceService.getAll();
    } catch (error) {
      return this.prismaErrorHandler.handle(error);
    }
  }

  @Get('/menu')
  async getMenuResources(@CurrentUser() user: any) {
    const { roleId } = user;

    if (!roleId) {
      throw new BadRequest('You have not been assigned a role yet', 403);
    }

    try {
      return await this.resourceService.getMenuResources(roleId);
    } catch (error) {
      return this.prismaErrorHandler.handle(error);
    }
  }

  @Get('/:id')
  async getOne(@Param('id') id: string, @CurrentUser() user: AuthUser, @QueryParam('resourceId', { required: true }) resourceId: string) {
    const { roleId } = user;

    if (!roleId) {
      throw new BadRequest('You have not been assigned a role');
    }

    const canView = await this.permissionService.canView(roleId, resourceId);
    if (!canView) {
      throw new BadRequest('Forbidden', 403);
    }

    try {
      return await this.resourceService.getOne(id);
    } catch (error) {
      return this.prismaErrorHandler.handle(error);
    }
  }
}

// In the above class, each method checks if the current user's role has the permission to carry out the activity before proceeding.
// If the user is not permitted, an error is thrown.
