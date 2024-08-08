import {RequestContext} from '@loopback/rest';
import {MultiTenancyStrategy} from '../types';


/**
 * Use `tenant-id` http query parameter to identify the tenant id
 */
export class QueryStrategy
  implements MultiTenancyStrategy {
  name = 'query';

  identifyTenant(requestContext: RequestContext) {
    const tenantId = requestContext.request.query['tenant-id'] as string;
    // console.log('tenant-id', tenantId);
    return tenantId == null ? undefined : {id: tenantId};
  }
}
