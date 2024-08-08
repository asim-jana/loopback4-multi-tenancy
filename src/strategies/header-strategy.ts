import {RequestContext} from '@loopback/rest';
import {MultiTenancyStrategy} from '../types';

/**
 * Use `x-tenant-id` http header to identify the tenant id
 */
export class HeaderStrategy
  implements MultiTenancyStrategy {
  name = 'header';

  identifyTenant(requestContext: RequestContext) {
    const tenantId = requestContext.request.headers['x-tenant-id'] as string;
    // console.log('x-tenant-id', tenantId);
    return tenantId == null ? undefined : {id: tenantId};
  }
}
