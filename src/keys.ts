import {BindingKey} from '@loopback/core';
import {juggler} from '@loopback/repository';
import {Middleware} from '@loopback/rest';
import {MultiTenancyComponent} from './component';
import {DatasourceConfigFn, SetupDatasourceFn, SetupMultitenancyFn, Tenant} from './types';

export namespace MultiTenancyBindings {

  export const COMPONENT = BindingKey.create<MultiTenancyComponent>(
    'components.MultiTenancyComponent',
  );
  export const MIDDLEWARE = BindingKey.create<Middleware>(
    'middleware.multitenancy',
  );
  export const CURRENT_TENANT = BindingKey.create<Tenant>(
    'multitenancy.currentTenant',
  );
  export const ACTION = BindingKey.create<SetupMultitenancyFn>(
    'multitenancy.actions.setupMultitenancy',
  );

  export const DATASOURCE_MIDDLEWARE = BindingKey.create<Middleware>(
    'middleware.multitenancyDatasource',
  );

  export const DATASOURCE_ACTION = BindingKey.create<SetupDatasourceFn>(
    'multitenancyDatasource.actions.setupDatasource',
  );

  export const DATASOURCE_CONFIG = BindingKey.create<DatasourceConfigFn>('multitenancyDatasource.config');

  export const DATASOURCE_PROVIDER = BindingKey.create<juggler.DataSource>('multitenancyDatasource.datasourceProvider');

  export const STRATEGY_EXTENSION_POINT_NAME = 'multitenancy.strategies';
  // export const INSTANCE_ID = BindingKey.create<string>(
  //   'multitenancy.instanceId',
  // );

}

