import { ExpressMiddlewareInterface } from 'routing-controllers';
import BadRequest from '../errors/bad-request';

export default class ResourceIdMiddleware implements ExpressMiddlewareInterface {
  async use(request: any, response: any, next: (err?: any) => any) {
    const excludeRoutes = ['/api/resources/menu'];

    if (excludeRoutes.some(route => request.path.startsWith(route))) {
      next();
    } else {
      const { resourceId } = request.query;
      if (!resourceId) {
        throw new BadRequest('resourceId is required');
      }
    }

    next();
  }
}
