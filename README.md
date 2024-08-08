# loopback4-multi-tenancy

[![LoopBack](https://github.com/strongloop/loopback-next/raw/master/docs/site/imgs/branding/Powered-by-LoopBack-Badge-(blue)-@2x.png)](http://loopback.io/)

## Overview

This package provides a robust multitenancy solution for Loopback 4 applications, allowing you to efficiently manage multiple tenants within a single application instance. It is designed to be flexible, easy to integrate, and scalable to handle various multitenant architectures.

## Features

- **Tenant Isolation:** Ensure data isolation between tenants.
- **Dynamic Tenant Resolution:** Automatically resolve tenants based on the incoming request.
- **Customizable Middleware:** Easily extend and customize the package for your specific needs.
- **Support for Multiple Databases:** Manage tenant-specific databases or schemas.
- **Flexible Tenant Detection Strategies:** Choose from multiple strategies to detect tenants, including:
  - **Header-Based Detection:** Extract tenant information from request headers.
  - **JWT-Based Detection:** Decode tenant information from JSON Web Tokens (JWTs).
  - **Host-Based Detection:** Identify tenants based on the request's host or subdomain.
  - **Query Parameter Detection:** Determine tenants using query parameters in the request URL.

## Installation

Install MultiTenancyComponent using `npm`;

```sh
npm install loopback4-multi-tenancy
```

## Basic Usage

To integrate `loopback4-multi-tenancy` into your LoopBack 4 application, follow these steps:

### 1. Add the Component

Import and add the **MultiTenancyComponent** to your application:

```ts
import { MultiTenancyComponent } from 'loopback4-multi-tenancy';

// ...

export class MyApplication extends BootMixin(ServiceMixin(RepositoryMixin(RestApplication))) {
  constructor(options: ApplicationConfig = {}) {
    super(options);
    // ...
    this.component(MultiTenancyComponent);
    // ...
  }
}
```

### 2. Configure Tenant Detection Strategies
Set up the strategies to detect tenants. There are **four available strategies**: `header`, `jwt`, `query`, and `host`. The default strategy is **`header`**, but you can specify others:

```ts
import { MultiTenancyBindings, MultiTenancyActionOptions } from 'loopback4-multi-tenancy';

// ...
this
  .configure<MultiTenancyActionOptions>(MultiTenancyBindings.ACTION)
  .to({ strategyNames: ['jwt', 'header', 'query'] });
// ...
```

### 3. Add Action Provider to the Sequence
If using an action-based sequence (not required for middleware-based sequences), add the datasource action provider to src/sequence.ts:

```ts
import { MultiTenancyBindings, SetupMultitenancyFn } from 'loopback4-multi-tenancy';
import { inject } from '@loopback/core';
import { RequestContext, SequenceHandler } from '@loopback/rest';

export class MySequence implements SequenceHandler {
  constructor(
    @inject(MultiTenancyBindings.ACTION)
    private readonly setupMultitenancy: SetupMultitenancyFn,
  ) {}

  async handle(context: RequestContext) {
    // ...
    await this.setupMultitenancy();
    // ...
  }
}
```

### 4. Access the Current Tenant
Inject the current tenant into your controllers:

```ts
import { inject } from '@loopback/core';
import { MultiTenancyBindings, Tenant } from 'loopback4-multi-tenancy';
import { post, requestBody, getModelSchemaRef } from '@loopback/rest';
import { User, UserRepository } from '../repositories';

export class UserController {
  constructor(
    @inject(MultiTenancyBindings.CURRENT_TENANT, { optional: true })
    private tenant?: Tenant,
    @repository(UserRepository)
    public userRepository: UserRepository,
  ) {}

  @post('/users', {
    responses: {
      '200': {
        description: 'User model instance',
        content: { 'application/json': { schema: getModelSchemaRef(User) } },
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, { title: 'NewUser', exclude: ['id'] }),
        },
      },
    })
    user: Omit<User, 'id'>,
  ): Promise<User> {
    user.tenantId = this.tenant?.id ?? '';
    return this.userRepository.create(user);
  }
}
```


## Advanced Usage

For dynamically configuring datasources at runtime, follow these steps:

### 1. Create a Datasource Provider

Define a provider to generate datasource configurations based on the current tenant. This provider will be used to configure datasources as needed:

```ts
import { Provider } from '@loopback/core';
import { DatasourceConfigFn, Tenant } from 'loopback4-multi-tenancy';
import { TenantRepository } from './repositories';

export class MultitenancyDatasourceConfigProvider implements Provider<DatasourceConfigFn> {
  constructor(
    @repository(TenantRepository)
    private tenantRepo: TenantRepository,
  ) {}

  value(): DatasourceConfigFn {
    return async (currentTenant?: Tenant) => {
      if (currentTenant?.id) {
        const tenantData = await this.tenantRepo.findById(currentTenant.id);
        return tenantData.dbConfig;
      }
      return null;
    };
  }
}
```
### 2. 🚨 *[IMPORTANT]* Create a default datasource
Create a default datasource for tenant. By default this datasource will be connected to the application and all the repositories of the tenant. This will be replace on run time. Assuming you are creating a new datasource with name **`tenant`**. This will use in next step.
    
### 3. Configure Datasource Bind Key
Provide the exact bindkey which is used in repository and datasource name of default tenant datasource. The default is **`tenant`**:

```ts
import { MultiTenancyBindings, DatasourceOptions } from 'loopback4-multi-tenancy';

// ...
this.configure<DatasourceOptions>(MultiTenancyBindings.DATASOURCE_ACTION).to({datasourceBindKey: 'tenant'});
// ...
```

This key is custom and it can be used as per your choice but your repository must use specified key in injection.

```ts
export class UserRepository extends DefaultCrudRepository<User,
    typeof User.prototype.id,
    UserRelations> {
    constructor(
        @inject('datasources.tenant') dataSource: JugglerDataSource,
    ) {
        super(User, dataSource);
    }
}
```

### 4. Bind the Provider in application.ts
Bind the **MultitenancyDatasourceConfigProvider** to your application configuration:

```ts
import { MultiTenancyBindings } from 'loopback4-multi-tenancy';

this.bind(MultiTenancyBindings.DATASOURCE_CONFIG).toProvider(MultitenancyDatasourceConfigProvider);
```

### 5. Add Datasource Action Provider to the Sequence
If using an action-based sequence (not required for middleware-based sequences), add the datasource action provider to src/sequence.ts.
- #### 🚨 Important: Configuration Order

    **Ensure that the datasource configuration is executed after the multitenancy setup** to avoid any issues with tenant context. 

- #### Steps:

1. **Complete the multitenancy setup**
2. **Then configure the datasource**

```ts
import { inject } from '@loopback/core';
import { SequenceHandler, RequestContext, SequenceActions } from '@loopback/rest';
import { MultiTenancyBindings, SetupMultitenancyFn, SetupDatasourceFn } from 'loopback4-multi-tenancy';

export class MySequence implements SequenceHandler {
  constructor(
    @inject(MultiTenancyBindings.ACTION)
    private readonly setupMultitenancy: SetupMultitenancyFn,
    @inject(MultiTenancyBindings.DATASOURCE_ACTION)
    private readonly setupDatasource: SetupDatasourceFn,
  ) {}

  async handle(context: RequestContext) {
    try {
      // ...
      await this.setupMultitenancy();
      await this.setupDatasource();
      // ...handle other sequence actions
    } catch (err) {
      this.reject(context, err);
    }
  }
}
```

**That's all.**

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Feedback

If you've noticed a bug or have a question or have a feature request, [search the issue tracker](https://github.com/asim-jana/loopback4-multi-tenancy/issues) to see if someone else in the community has already created a ticket.
If not, go ahead and [make one](https://github.com/asim-jana/loopback4-multi-tenancy/issues/new/choose)!
All feature requests are welcome. Implementation time may vary. Feel free to contribute the same, if you can.
If you think this extension is useful, please [star](https://help.github.com/en/articles/about-stars) it. Appreciation really helps in keeping this project alive.
