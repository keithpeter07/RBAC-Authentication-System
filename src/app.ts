import 'reflect-metadata';

import bodyParser from 'body-parser';
import compression from 'compression';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { useExpressServer } from 'routing-controllers';
import passport from 'passport';
import Container from 'typedi';
import ApplicationError from './errors/application-error';
import logger from './loggers/logger';
import PassportStrategy from './passport';

const app = express();

function logResponseTime(req: Request, res: Response, next: NextFunction) {
  const startHrTime = process.hrtime();

  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;
    const message = `${req.method} ${res.statusCode} ${elapsedTimeInMs}ms\t${req.path}`;
    logger.log({
      level: 'debug',
      message,
      consoleLoggerOptions: { label: 'API' }
    });
  });

  next();
}

app.use(logResponseTime);

app.use(compression() as any);

// app.use('/', (req, res, next) => {
//   console.log(req.headers);
//   next();
// });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(passport.initialize());

passport.use(Container.get(PassportStrategy).createJwtStrategy());

useExpressServer(app, {
  routePrefix: '/api',
  controllers: [path.join(__dirname, '/controllers/*.controller.ts')],
  defaultErrorHandler: false,
  cors: true,
  currentUserChecker: action => action.request.user
});

app.use(
  (
    err: ApplicationError,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (res.headersSent) {
      return next(err);
    }
    return res.status(err.status || 500).send(err);
  }
);

export default app;
