import {Provider} from '@loopback/core';
import {DatasourceConfigFn} from '../types';

export class DatasourceConfigProvider
  implements Provider<DatasourceConfigFn> {
  constructor() { }

  value(): DatasourceConfigFn {
    // console.log("Enter datasource config provider");
    return async () => {
      return null;
    };
  }
}
