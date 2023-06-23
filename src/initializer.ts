//
// =================================================================================NOTE=========================================================================
// THIS FILE IS FOR TESTING PURPOSES ONLY
// IT INITIALIZES THE SUPERUSER AND REQUIRED RESOURCE IN THE DATABASE

import jwt, { JwtPayload } from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import {
  AuthUser, Password, AuthRole, AuthPermission, AuthResource
} from '@prisma/client';
import prisma from './prisma';

const createSuperuser = (email: string, name: string): Promise<AuthUser> => prisma.authUser.create({ data: { email, name } });

const genToken = (userId: string, email: string) => jwt.sign({ id: userId, email }, process.env.JWT_SECRET!);

const createPassword = (pass: string, token: string): Promise<Password> => {
  const payload = jwt.decode(token);
  const hashedPassword = bcrypt.hashSync(pass, 10);

  const userId = (payload as JwtPayload).id;

  return prisma.password.create({ data: { userId: userId || null, hash: hashedPassword } });
};

// const createResource = (name: string, key: string): Promise<AuthResource> => prisma.authResource.create({ data: { name, key } });

const createRole = (name: string): Promise<AuthRole> => prisma.authRole.create({ data: { name } });

const createPermissions = (roleId: number, resourceId: string):Promise<AuthPermission> => prisma.authPermission.create({
  data: {
    roleId,
    resourceId,
    canCreate: true,
    canView: true,
    canUpdate: true,
    canDelete: true
  }
});

const updateUserRole = (userId: string, roleId: number): Promise<AuthUser> => prisma.authUser.update({
  where: { id: userId },
  data: { roleId }
});

const createResource = (name: string, key: string): Promise<AuthResource> => prisma.authResource.create({
  data: { name, key }
});

const main = async () => {
  const user = await createSuperuser('superuser@system.com', 'superuser');
  const token = genToken(user.id, user.email);
  const password = await createPassword('mypass', token);

  // const resource = await createResource('RESOURCES', 'RESOURCES');

  const role = await createRole('superuser');

  const resource = await createResource('resources', 'RESOURCES');

  const permissions = await createPermissions(role.id, resource.id);

  const updatedUser = await updateUserRole(user.id, role.id);

  console.log('===============USER================');
  console.log(user);
  console.log('\n');
  console.log('===============RESOURCE=============');
  console.log(resource);
  console.log('\n');
  console.log('===============ROLE=============');
  console.log(role);
  console.log('\n');
  console.log('===============PERMISSIONS=============');
  console.log(permissions);
  console.log('\n');
  console.log('===============UPDATED USER=============');
  console.log(updatedUser);
  console.log('\n');
  console.log(password);
};

export default main;

export const suPermission = async (roleId: number, resourceId: string) => {
  const perm = await createPermissions(roleId, resourceId);
  return perm;
};
