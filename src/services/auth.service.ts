import Container, { Service } from 'typedi';
import { AuthJwtToken, AuthUser, UserRoles } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';
import dotenv from 'dotenv';
import { UserService } from './user.service';
import prisma from '../prisma';

const result = dotenv.config();
if (result.error) {
  dotenv.config({ path: '.env.default' });
}
@Service()
export class AuthService {
  constructor(
        private readonly userService: UserService = Container.get(UserService)
  ) {}

  public async validateUser(email: string, password: string): Promise<AuthUser | null> {
    const user = await this.userService.getByEmail(email);
    if (user) {
      const storedPassword = await this.userService.getPassword(user.id);
      if (storedPassword) {
        const isPasswordValid = await this.comparePasswords(password, storedPassword.hash);
        if (isPasswordValid) {
          return user;
        }
      }
    }
    return null;
  }

  public async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  public async comparePasswords(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  public async generateToken(user: AuthUser): Promise<string> {
    const payload = {
      id: user.id,
      email: user.email
    };
    return jsonwebtoken.sign(payload, process.env.JWT_SECRET as string, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });
  }

  public async createAuthJwt(user: AuthUser): Promise<AuthJwtToken> {
    const token = (await this.generateToken(user)).toString();
    return prisma.authJwtToken.create({
      data: {
        token,
        userId: user.id
      }
    });
  }

  public async decodeToken(token: string): Promise<any> {
    return jsonwebtoken.decode(token);
  }

  public async verifyToken(token: string): Promise<any> {
    return jsonwebtoken.verify(token, process.env.JWT_SECRET as string);
  }

  public async getTokenFromHeaders(headers: any): Promise<string | null> {
    const token = headers.authorization;
    if (token && token.split(' ')[0] === 'Bearer') {
      return token.split(' ')[1];
    }
    return null;
  }

  public async getRolesFromToken(token: string): Promise<UserRoles[]> {
    const decodedToken = await this.decodeToken(token);
    const roles = await this.userService.getAuthUserRoles(decodedToken.id);
    return roles;
  }

  public async validateToken(token: string): Promise<boolean> {
    try {
      await this.verifyToken(token);
      return true;
    } catch (error) {
      return false;
    }
  }

  public async validateTokenAndRoles(token: string, roles: UserRoles[]): Promise<boolean> {
    const isValid = await this.validateToken(token);
    if (isValid) {
      const tokenRoles = await this.getRolesFromToken(token);
      const hasRole = roles.some(role => tokenRoles.some(tokenRole => tokenRole.id === role.id));
      return hasRole;
    }
    return false;
  }
}
