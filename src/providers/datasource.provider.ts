import {Provider} from '@loopback/core';
import {juggler} from '@loopback/repository';
import {DataSourceConfig, DatasourceProviderFn} from '../types';
import {DatasourceErrorHandler} from '../utils';

export class DatasourceProvider implements Provider<DatasourceProviderFn> {
  constructor(

  ) {
  }

  value(): DatasourceProviderFn {
    // console.log('Entering datasource provider');
    return async (dataSourceConfig) => {
      try {
        // console.log('DataSourceConfig:', dataSourceConfig);
        // console.log('Return datasource');
        return await this.createDataSource(dataSourceConfig);
      } catch (error) {
        throw DatasourceErrorHandler.handle(error);
      }
    }
  }

  async createDataSource(config: DataSourceConfig): Promise<juggler.DataSource> {
    return new Promise((resolve, reject) => {
      // console.log('Create datasource');
      const ds = new juggler.DataSource(config);
      ds.once('connected', async () => {
        // console.log('Datasource connected');
        try {
          // Check if the connection is valid
          await ds.ping();
          resolve(ds); // Resolve the promise when the connection is established
        } catch (error) {
          // console.error('Error connecting to datasource:', error);
          reject(error); // Reject if there's an error during ping
        }
      });
      ds.once('error', (err) => {
        // console.error('Datasource returned error:', err);
        reject(err); // Reject the promise if there's an error
      });
      ds.connect(); // Start the connection
    });
  }
}
