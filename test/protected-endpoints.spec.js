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
      it('returns 401 and Missing Basic token error when no basic token', () => {
        return endpoint.method(endpoint.path)
          .expect(401, {error: 'Missing basic token'});
      });
      it('returns 401 when no credentials in token', () => {
        const userNoCreds = {user_name: '', password: ''};
        return endpoint.method(endpoint.path)
          .set('Authorization', helpers.makeAuthHeader(userNoCreds))
          .expect(401, { error: 'Unauthorized request' });
      });
      it('returns 401 when invalid user', () => {
        const userInvalidCreds = {user_name:'fake-user', password:'existy'};
        return endpoint.method(endpoint.path)
          .set('Authorization', helpers.makeAuthHeader(userInvalidCreds))
          .expect(401, { error: 'Unauthorized request' });
      });
      it('returns 401 when invalid password', () => {
        const userInvalidPass = { user_name: testUsers[0].user_name, password: 'wrong'};
        return endpoint.method(endpoint.path)
          .set('Authorization', helpers.makeAuthHeader(userInvalidPass))
          .expect(401, { error: 'Unauthorized request' });
      });
    });
  });
});