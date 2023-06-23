import Transport from 'winston-transport';
import Container from 'typedi';
import { AuditTrailService } from '../services/auditTrail.service';

export class AuthAuditTransport extends Transport {
  private readonly authAuditService;

  constructor() {
    super();
    this.authAuditService = Container.get(AuditTrailService);
  }

  log(info: any, callback: {(): void}) {
    const authAuditData = {
      action: true,
      actionDescription: info.message,
      url: info.url,
      ipAddress: info.ipAddress,
      userAgent: info.userAgent,
      userId: info.userId
    };

    this.authAuditService.create(authAuditData);

    callback();
  }
}
