import {config, CoreBindings, Getter, inject, injectable, Provider} from '@loopback/core';
import {RepositoryBindings, RepositoryTags} from '@loopback/repository';
import {
  asMiddleware,
  Middleware,
  RequestContext,
  RestApplication,
  RestMiddlewareGroups
} from '@loopback/rest';
import {MultiTenancyBindings} from '../keys';
import {
  DatasourceConfigFn,
  DatasourceOptions,
  DatasourceProviderFn,
  SetupDatasourceFn,
  Tenant
} from '../types';

export class DatasourceActionProvider
  implements Provider<SetupDatasourceFn> {
  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE)
    private application: RestApplication,
    @config()
    private options: DatasourceOptions = {
      datasourceBindKey: 'tenant',
    },
    @inject(MultiTenancyBindings.DATASOURCE_CONFIG)
    private readonly getDatasourceConfig: DatasourceConfigFn,
    @inject(MultiTenancyBindings.DATASOURCE_PROVIDER)
    private readonly getDatasourceProvider: DatasourceProviderFn,
    @inject.getter(MultiTenancyBindings.CURRENT_TENANT)
    private currentTenant: Getter<Tenant>,
    @inject.context() private requestCtx: RequestContext,
  ) { }

  value(): SetupDatasourceFn {
    // console.log('Entering datasource setup');
    return async () => {
      await this.action();
    };
  }

  async action() {
    if (this.requestCtx.isBound(MultiTenancyBindings.CURRENT_TENANT)) {
      // console.log('Current tenant bound');
      const currentTenant = await this.currentTenant();
      // console.log('Current tenant:', currentTenant);
      const dataSourceConfig = await this.getDatasourceConfig(currentTenant);
      // console.log('Datasource config:', dataSourceConfig);
      if (dataSourceConfig) {
        // console.log('Datasource found');
        try {
          const key = this.options.datasourceBindKey;
          const dbBindKey = `${RepositoryBindings.DATASOURCES}.${key}.${currentTenant.id}`;
          if (!this.application.isBound(dbBindKey)) {
            // console.log("Bind new datasource");
            const datasourceProvider = await this.getDatasourceProvider(dataSourceConfig);
            this.application
              .bind(dbBindKey)
              .to(datasourceProvider)
              .tag(RepositoryTags.DATASOURCE);
          }
          this.requestCtx
            .bind(`${RepositoryBindings.DATASOURCES}.${key}`)
            .toAlias(dbBindKey);
        } catch (error) {
          // console.error('Datasource action error:', error);
          throw error;
        }

      }


    }

  }

}

@injectable(
  asMiddleware({
    group: RestMiddlewareGroups.MIDDLEWARE,
    downstreamGroups: RestMiddlewareGroups.FIND_ROUTE,
  }),
)
export class DatasourceMiddlewareProvider
  implements Provider<Middleware> {
  constructor(
    @inject(MultiTenancyBindings.DATASOURCE_ACTION)
    private readonly setupDatasource: SetupDatasourceFn,
  ) { }
  value(): Middleware {
    // console.log('Entering datasource middleware');
    return async (ctx, next) => {
      try {
        await this.setupDatasource();
      } catch (error) {
        // console.log('Middleware error:', error);
        throw error;
      }
      return next();
    };
  }
}

