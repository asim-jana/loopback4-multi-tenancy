import {config} from '@loopback/core';
import {RequestContext} from '@loopback/rest';
import {MultiTenancyStrategy, Tenant} from '../types';

/**
 * Use `host` to identify the tenant id
 */
export class HostStrategy implements MultiTenancyStrategy {
  name = 'host';

  @config()
  mapping: Record<string, string> = {
  };

  identifyTenant(requestContext: RequestContext) {
    const host = requestContext.request.headers.host;
    // console.log('host', host);
    return this.mapHostToTenant(host);
  }

  mapHostToTenant(host: string | undefined): Tenant | undefined {
    if (host == null) return undefined;
    const hostname = host.split(':')[0];
    const id = this.mapping[hostname];
    // console.log('tenant id for host %s: %s', hostname, id);
    if (id == null) return undefined;
    return {id};
  }
}
