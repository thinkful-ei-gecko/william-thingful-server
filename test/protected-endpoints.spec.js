const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe('Protected endpoints', function() {
  let db;

  const {
    testUsers,
    testThings,
    testReviews,
  } = helpers.makeThingsFixtures();

  before('Connect to DB', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    });
    app.set('db',db);
  });

  after('Destroy connection to DB', () => {
    return db.destroy();
  });

  before('Clear table before ALL tests', () => helpers.cleanTables(db));

  afterEach('Clear table after EACH test', () => helpers.cleanTables(db));

  beforeEach('Insert data into tables', () => 
    helpers.seedThingsTables(
      db,
      testUsers,
      testThings,
      testReviews
    )
  );

  const protectedEndpoints = [
    {
      name: 'GET /api/things/:thing_id',
      path: '/api/things/1',
      method: supertest(app).get,
    },
    {
      name: 'GET /api/things/:thing_id/reviews',
      path: '/api/things/1/reviews',
      method: supertest(app).get,
    },
    {
      name: 'POST /api/reviews',
      path: '/api/reviews',
      method: supertest(app).post,
    },
  ];

  protectedEndpoints.forEach(endpoint => {
    describe(endpoint.name, () => {
      it('returns 401 and Missing Bearer token error when no bearer token', () => {
        return endpoint.method(endpoint.path)
          .expect(401, {error: 'Missing bearer token'});
      });
      it('returns 401 when invalid JWT secret', () => {
        const validUser = testUsers[0];
        const invalidSecret = 'bad-secret';
        return endpoint.method(endpoint.path)
          .set('Authorization', helpers.makeAuthHeader(validUser, invalidSecret))
          .expect(401, { error: 'Unauthorized request' });
      });
      it('returns 401 when invalid subject in payload', () => {
        const invalidUser = {user_name:'fake-user', id: 1};
        return endpoint.method(endpoint.path)
          .set('Authorization', helpers.makeAuthHeader(invalidUser))
          .expect(401, { error: 'Unauthorized request' });
      });
    });
  });
});