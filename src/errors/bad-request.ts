import ApplicationError from './application-error';

export default class BadRequest extends ApplicationError {
  constructor(message?: string, status?: number) {
    super(message || 'Bad request', status || 400);
  }
}
