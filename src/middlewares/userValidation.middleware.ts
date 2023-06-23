import { ExpressMiddlewareInterface } from 'routing-controllers';
import { body, validationResult } from 'express-validator';
import BadRequest from '../errors/bad-request';
import prisma from '../prisma';

export default class UserValidationMiddleware implements ExpressMiddlewareInterface {
  async use(request: any, response: any, next: (err?: any) => any) {
    await body('email')
      .notEmpty()
      .withMessage('Email cannot be empty')
      .isEmail()
      .trim()
      .normalizeEmail()
      .withMessage('Enter a valid email address')
      .run(request);

    await body('name')
      .notEmpty()
      .withMessage('Name cannot be empty')
      .run(request);

    await body('roleId')
      .optional()
      .isInt()
      .withMessage('Invalid role')
      .run(request);

    await body('phone')
      .optional()
      .matches(/^\d{10,12}$/)
      .withMessage('Phone number is invalid')
      .run(request);

    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      throw new BadRequest(errors.array()[0].msg);
    }

    const exists = await prisma.authUser.findUnique({
      where: {
        email: request.body.email
      }
    });
    if (exists) {
      throw new BadRequest('A user with this email already exists', 409);
    }

    return next();
  }
}
