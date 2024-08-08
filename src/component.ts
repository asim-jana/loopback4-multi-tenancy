import {
  Binding,
  Component,
  Constructor,
  ContextTags,
  createBindingFromClass,
  extensionFor,
  injectable,
} from '@loopback/core';
import {DatasourceActionProvider, DatasourceConfigProvider, DatasourceMiddlewareProvider, DatasourceProvider, MultiTenancyActionProvider, MultiTenancyMiddlewareProvider, MultiTenancyStrategy} from './';
import {MultiTenancyBindings} from './keys';
import {
  HeaderStrategy,
  HostStrategy,
  JWTStrategy,
  QueryStrategy,
} from './strategies';

@injectable({tags: {[ContextTags.KEY]: MultiTenancyBindings.COMPONENT}})
export class MultiTenancyComponent implements Component {
  providers = {
    [MultiTenancyBindings.MIDDLEWARE.key]: MultiTenancyMiddlewareProvider,
    [MultiTenancyBindings.ACTION.key]: MultiTenancyActionProvider,
    [MultiTenancyBindings.DATASOURCE_CONFIG.key]: DatasourceConfigProvider,
    [MultiTenancyBindings.DATASOURCE_PROVIDER.key]: DatasourceProvider,
    [MultiTenancyBindings.DATASOURCE_ACTION.key]: DatasourceActionProvider,
    [MultiTenancyBindings.DATASOURCE_MIDDLEWARE.key]: DatasourceMiddlewareProvider,
  };
  bindings: Binding[] = [
    ...this.createStrategyBindings([
      JWTStrategy,
      HeaderStrategy,
      QueryStrategy,
      HostStrategy,
    ]),
  ];

  private createStrategyBindings(
    strategyClasses: Constructor<MultiTenancyStrategy>[],
  ): Binding[] {
    return strategyClasses.map(strategyClass =>
      createBindingFromClass(strategyClass).apply(
        extensionFor(MultiTenancyBindings.STRATEGY_EXTENSION_POINT_NAME),
      ),
    );
  }
}
