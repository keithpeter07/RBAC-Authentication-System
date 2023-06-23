import { Service } from 'typedi';
import {
  Prisma
} from '@prisma/client';
import logger from '../loggers/logger';
import BadRequest from './bad-request';
import ApplicationError from './application-error';

@Service()
export class PrismaErrorHandler {
  handle(error: any) {
    switch (true) {
      case error instanceof Prisma.PrismaClientKnownRequestError:
        this.handleKnownRequestError(error);
        break;
      case error instanceof Prisma.PrismaClientInitializationError:
        this.handleInitializationError();
        break;
      case error instanceof Prisma.PrismaClientUnknownRequestError:
        this.handleUnknownRequestError();
        break;
      case error instanceof Prisma.PrismaClientRustPanicError:
        this.handleRustPanicError();
        break;
      case error instanceof Prisma.PrismaClientValidationError:
        this.handleValidationError();
        break;
      default:
        logger.error('unknown server error');
        throw new ApplicationError('Unknown Server Error', 500);
    }
  }

  private handleKnownRequestError(error: any) {
    logger.error('prisma known request error');
    throw new BadRequest(error.message, 400);
  }

  private handleInitializationError() {
    logger.error('prisma initialization error');
    throw new ApplicationError('Server error', 500);
  }

  private handleRustPanicError() {
    logger.error('prisma rust panic error');
    throw new ApplicationError('Server error', 500);
  }

  private handleUnknownRequestError() {
    logger.error('prisma unknown request error');
    throw new ApplicationError('Server error', 500);
  }

  private handleValidationError() {
    logger.error('prisma validation error');
    throw new BadRequest('Validation Error. Data is invalid', 400);
  }
}
