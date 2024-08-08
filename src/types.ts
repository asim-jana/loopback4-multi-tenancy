import {ValueOrPromise} from '@loopback/core';
import {juggler} from '@loopback/repository';
import {RequestContext} from '@loopback/rest';

/**
 * Information about a tenant in the multi-tenancy environment
 */
export interface Tenant {
  id: string;
  [attribute: string]: unknown;
}

export interface MultiTenancyOptions {
  strategyNames: string[];
}

/**
 * Interface for a multi-tenancy strategy to implement
 */
export interface MultiTenancyStrategy {
  /**
   * Name of the strategy
   */
  name: string;
  /**
   * Identify the tenant for a given http request
   * @param requestContext - Http request
   */
  identifyTenant(
    requestContext: RequestContext,
  ): ValueOrPromise<Tenant | undefined>;

}

export interface SetupMultitenancyFn {
  (): Promise<Tenant | undefined>;
}

export interface DatasourceOptions {
  datasourceBindKey: string;
}

export interface DataSourceConfig {
  name: string,
  connector: string,
  url?: string,
  host: string,
  port: number,
  user: string,
  password: string,
  database: string
}
export interface DatasourceConfigFn {
  (tenant: Tenant): Promise<DataSourceConfig | null>;
}

export interface DatasourceProviderOptions {
  [prop: string]: unknown;
}

export interface DatasourceProviderFn {
  (dataSourceConfig: DataSourceConfig): Promise<juggler.DataSource>;
}

export interface SetupDatasourceFn {
  (): Promise<void>;
}

export interface TenantDatasource {
  id: string;
  instanceId: string;
  [attribute: string]: unknown;
}
