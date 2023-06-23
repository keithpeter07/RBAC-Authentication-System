import { ExpressMiddlewareInterface } from 'routing-controllers';
import { body, validationResult } from 'express-validator';
import BadRequest from '../errors/bad-request';

export default class LoginValidationMiddleware implements ExpressMiddlewareInterface {
  async use(request: any, response: any, next: (err?: any) => any) {
    await body('email')
      .notEmpty()
      .withMessage('Email cannot be empty')
      .isEmail()
      .trim()
      .normalizeEmail()
      .withMessage('Enter a valid email address')
      .run(request);

    await body('password')
      .notEmpty()
      .withMessage('Password cannot be empty')
      .run(request);

    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      throw new BadRequest(errors.array()[0].msg);
    }
    return next();
  }
}
