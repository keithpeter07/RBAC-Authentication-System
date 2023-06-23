import {
  Controller, Body, Post, Get, UseBefore
} from 'routing-controllers';
import { Container } from 'typedi';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import BadRequest from '../errors/bad-request';
import main, { suPermission } from '../initializer';
import LoginValidationMiddleware from '../middlewares/loginValidation.middleware';

@Controller('/auth')
// @UseBefore(passport.authenticate('jwt', { session: false }))
export class AuthController {
  constructor(
        private readonly userService: UserService = Container.get(UserService),
        private readonly authService: AuthService = Container.get(AuthService),
  ) { }

    @Post('/login')
    @UseBefore(LoginValidationMiddleware)
  async login(@Body() userData: any) {
    const { email, password } = userData;
    const user = await this.authService.validateUser(email, password);
    if (user) {
      const token = await this.authService.generateToken(user);
      return {
        user,
        token
      };
    }
    throw new BadRequest('Invalid credentials');
  }

    @Post('/createPassword')
    async createPassword(@Body() data: any) {
      const { password, token } = data;
      const userData = await this.authService.decodeToken(token);
      const hashedPassword = await this.authService.hashPassword(password);

      return this.userService.createPassword(userData.id, hashedPassword);
    }

    // THIS ROUTE IS FOR TESTING PURPOSES ONLY
    @Get('/initialize')
    async initialize() {
      main();
    }

    @Post('/perm')
    async addPermission(@Body() body: any) {
      const { roleId, resourceId } = body;
      return suPermission(roleId, resourceId);
    }
}
