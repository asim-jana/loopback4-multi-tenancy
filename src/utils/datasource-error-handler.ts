import {HttpErrors} from '@loopback/rest';

export class DatasourceErrorHandler {
  static handle(error: any) {
    if (error.name === 'MongoError' || error.name === 'MongoNetworkError') {
      switch (error.code) {
        case 11000:
          throw new HttpErrors.Conflict('Duplicate key error: A record with this key already exists.');
        // Add more MongoDB error cases as needed
        default:
          throw new HttpErrors.InternalServerError(`MongoDB error: ${error.message}`);
      }
    } else if (error.code) {
      switch (error.code) {
        case 'ER_BAD_DB_ERROR':
          throw new HttpErrors.NotFound(`Database error: Unknown database '${error.sqlMessage}'`);
        case 'ER_ACCESS_DENIED_ERROR':
          throw new HttpErrors.Unauthorized('Access denied for user. Check your database credentials.');
        // Add more MySQL error cases as needed
        case 'ER_PARSE_ERROR':
          throw new HttpErrors.BadRequest(`SQL syntax error: ${error.sqlMessage}`);
        default:
          throw new HttpErrors.InternalServerError(`Database error: ${error.sqlMessage}`);
      }
    } else if (error.message.includes('ECONNREFUSED')) {
      throw new HttpErrors.ServiceUnavailable('Database connection was refused. Please check if the database server is running.');
    } else if (error.message.includes('ETIMEDOUT')) {
      throw new HttpErrors.RequestTimeout('Database connection timed out. Please try again later.');
    } else {
      throw new HttpErrors.InternalServerError('An unexpected error occurred');
    }
  }
}
