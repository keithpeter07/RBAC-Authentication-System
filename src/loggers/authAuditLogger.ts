import {
  createLogger,
  format
} from 'winston';
import ConsoleLoggerTransport from '../lib/winston-console-transport';
import { AuthAuditTransport } from '../lib/winston-prisma-transport';

const logTransports = [
  new AuthAuditTransport(),
  new ConsoleLoggerTransport()
];

const logger = createLogger({
  format: format.combine(
    format.timestamp()
  ),
  transports: logTransports,
  defaultMeta: { service: 'api' },
  level: process.env.NODE_ENV === 'development' ? 'silly' : 'info'
});

const authAuditLogger = (data: {message: string, userId: string, url: string, ipAddress: string, userAgent: string}) => {
  logger.log({
    level: 'info',
    ...data
  });
};

export default authAuditLogger;
