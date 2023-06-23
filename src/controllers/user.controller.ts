import {
  Controller, Param, Body, Get, Post, Put, Delete, UseBefore, CurrentUser, QueryParam, Req
} from 'routing-controllers';
import { Container } from 'typedi';
import passport from 'passport';
import { AuthUser } from '@prisma/client';
import { UserService } from '../services/user.service';
import UserValidationMiddleware from '../middlewares/userValidation.middleware';
import BadRequest from '../errors/bad-request';
import { AuthService } from '../services/auth.service';
import ResourceIdMiddleware from '../middlewares/resourceId.middleware';
import { PermissionService } from '../services/permission.service';
import { PrismaErrorHandler } from '../errors/prismaErrorHandler';
import MailService from '../services/email.service';

interface customRequest extends Request{
  auditTrail: string
}

@Controller('/users')
@UseBefore((passport.authenticate('jwt', { session: false })), ResourceIdMiddleware)
export class UserController {
  constructor(
        private readonly userService: UserService = Container.get(UserService),
        private readonly authService: AuthService = Container.get(AuthService),
        private readonly permissionService: PermissionService = Container.get(PermissionService),
        private readonly prismaErrorHandler: PrismaErrorHandler = Container.get(PrismaErrorHandler),
        private readonly emailService: MailService = Container.get(MailService)
  ) { }

    @Get('/')
  getAll() {
    return this.userService.getAll();
  }

    @Get('/:id')
    getOne(@Param('id') id: string) {
      return this.userService.getOne(id);
    }

    @Post('/createUser')
    @UseBefore(UserValidationMiddleware)
    async createUser(@Req() req: customRequest, @Body() userData: any, @CurrentUser() user: AuthUser, @QueryParam('resourceId') resourceId: string) {
      const { roleId } = user;

      if (!roleId) {
        throw new BadRequest('You have not been assigned a role');
      }

      const canCreate = this.permissionService.canCreate(roleId, resourceId);

      if (!canCreate) {
        throw new BadRequest('Forbidden', 403);
      }

      let createdUser;
      try {
        createdUser = await this.userService.create(userData);
      } catch (error) {
        return this.prismaErrorHandler.handle(error);
      }

      if (!createdUser) {
        throw new BadRequest('User cannot be created');
      }

      let savedJwt;
      try {
        savedJwt = await this.authService.createAuthJwt(createdUser);
      } catch (error) {
        return this.prismaErrorHandler.handle(error);
      }

      // Send an email with first time login link to the user - The link contains the jwt

      req.auditTrail = `created user: ${createdUser.name}, email: ${createdUser.email}`;
      return {
        createdUser,
        createdUserToken: savedJwt.token
      };
    }

    @Put('/update/:id')
    async put(@Req() req: customRequest, @Param('id') id: string, @Body() userData: any, @CurrentUser() user: AuthUser, @QueryParam('resourceId') resourceId: string) {
      const { roleId } = user;

      if (!roleId) {
        throw new BadRequest('You have not been assigned a role');
      }

      const canUpdate = this.permissionService.canUpdate(roleId, resourceId);

      if (!canUpdate) {
        throw new BadRequest('Forbidden', 403);
      }

      let updatedUser;
      try {
        updatedUser = await this.userService.update(id, userData);
      } catch (error) {
        return this.prismaErrorHandler.handle(error);
      }

      req.auditTrail = `updated user: ${updatedUser.email}, update: ${JSON.stringify(userData)}`;
      return updatedUser;
    }

    @Delete('/delete/:id')
    async delete(@Req() req: customRequest, @Param('id') id: string, @CurrentUser() user: AuthUser, @QueryParam('resourceId') resourceId: string) {
      const { roleId } = user;

      if (!roleId) {
        throw new BadRequest('You have not been assigned a role');
      }

      const canDelete = await this.permissionService.canDelete(roleId, resourceId);
      if (!canDelete) {
        throw new BadRequest('You are not allowed to delete users', 403);
      }

      let deletedUser;
      try {
        deletedUser = await this.userService.delete(id);
      } catch (error) {
        return this.prismaErrorHandler.handle(error);
      }

      req.auditTrail = `deleted user: ${deletedUser.email}`;
      return deletedUser;
    }
}
