import {
  config,
  ContextTags,
  extensionPoint,
  extensions,
  Getter,
  inject,
  injectable,
  Provider
} from '@loopback/core';
import {asMiddleware, Middleware, RequestContext, RestMiddlewareGroups} from '@loopback/rest';
import {MultiTenancyBindings} from '../keys';
import {MultiTenancyOptions, MultiTenancyStrategy, SetupMultitenancyFn} from '../types';

@extensionPoint(
  MultiTenancyBindings.STRATEGY_EXTENSION_POINT_NAME,
  {
    tags: {
      [ContextTags.KEY]: MultiTenancyBindings.MIDDLEWARE,
    },
  },
)
export class MultiTenancyActionProvider implements Provider<SetupMultitenancyFn> {
  constructor(
    @extensions()
    private readonly getMultiTenancyStrategies: Getter<MultiTenancyStrategy[]>,
    @config()
    private options: MultiTenancyOptions = {
      strategyNames: ['header'],
    },
    @inject.context() private requestCtx: RequestContext,
  ) { }

  value(): SetupMultitenancyFn {
    return () => this.action();
  }

  /**
   * The implementation of authenticate() sequence action.
   * @param request - The incoming request provided by the REST layer
   */
  async action() {
    // console.log('Identifying tenant for request %s', this.requestCtx.basePath);
    const tenancy = await this.identifyTenancy(this.requestCtx);
    if (tenancy == null) return;
    // console.log(
    //   'Tenant identified by strategy %s',
    //   tenancy.strategy.name,
    //   tenancy.tenant,
    // );

    // const instanceId = uuidv4();
    let currentTenant = {
      id: tenancy.tenant.id,
      // instanceId: instanceId,
    }
    // console.log('Binding resources for tenant', currentTenant);
    this.requestCtx.bind(MultiTenancyBindings.CURRENT_TENANT).to(currentTenant);
    return tenancy.tenant;
  }

  private async identifyTenancy(requestCtx: RequestContext) {
    // console.log('Tenancy action is configured with', this.options);
    const strategyNames = this.options.strategyNames;
    let strategies = await this.getMultiTenancyStrategies();
    // console.log('strategies', strategies);
    strategies = strategies
      .filter(s => strategyNames.includes(s.name))
      .sort((a, b) => {
        return strategyNames.indexOf(a.name) - strategyNames.indexOf(b.name);
      });
    // console.log('Tenancy strategies', strategies.map(s => s.name));
    for (const strategy of strategies) {
      // console.log('Trying tenancy strategy %s', strategy.name);
      const tenant = await strategy.identifyTenant(requestCtx);
      if (tenant != null) {
        // console.log('Tenant is now identified by strategy %s', strategy.name, tenant);
        return {tenant, strategy};
      }
    }
    // console.log('No tenant is identified');
    return undefined;
  }
}

@injectable(
  asMiddleware({
    group: RestMiddlewareGroups.MIDDLEWARE,
    downstreamGroups: RestMiddlewareGroups.FIND_ROUTE,
  }),
)
export class MultiTenancyMiddlewareProvider implements Provider<Middleware> {
  constructor(
    @inject(MultiTenancyBindings.ACTION)
    private setupMultitenancy: SetupMultitenancyFn,
  ) { }

  value(): Middleware {
    // console.log('Entering multitenancy middleware');
    return async (ctx, next) => {
      try {
        await this.setupMultitenancy();
        return next();
      } catch (error) {
        // console.log('Middleware error:', error);
      }

    };
  }
}
