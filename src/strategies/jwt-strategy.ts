import {RequestContext} from '@loopback/rest';
import {decode} from 'jsonwebtoken';
import {MultiTenancyStrategy} from '../types';


/**
 * Use jwt token to identify the tenant id
 */
export class JWTStrategy implements MultiTenancyStrategy {
  name = 'jwt';

  identifyTenant(requestContext: RequestContext) {
    const authorization = requestContext.request.headers['authorization'] as string;
    // console.log('authorization', authorization);
    if (authorization?.startsWith('Bearer ')) {
      //split the string into 2 parts : 'Bearer ' and the `xxx.yyy.zzz`
      const parts = authorization.split(' ');
      const token = parts[1];
      // console.log('JWT token', authorization);
      const json = decode(token, {json: true});
      // console.log('Token', json);
      const tenantId = json?.tenantId;
      // console.log('Tenant id', tenantId);
      return tenantId == null ? undefined : {id: tenantId};
    }
  }
}
