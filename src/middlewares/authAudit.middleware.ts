import { ExpressMiddlewareInterface } from 'routing-controllers';
import authAuditLogger from '../loggers/authAuditLogger';

export default class AuthAuditMiddleware implements ExpressMiddlewareInterface {
  use(request: any, response: any, next: (err?: any) => any) {
    if (request.method === 'GET') {
      return next();
    }

    const data = {
      message: request.auditTrail || 'UNKNOWN',
      userId: request.user.id,
      ipAddress: request.ip || 'UNKNOWN',
      userAgent: request.headers['user-agent'] || 'UNKNOWN',
      url: request.url || 'UNKNOWN'
    };

    authAuditLogger(data);

    return next();
  }
}
