const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');
const jwt = require('jsonwebtoken');

describe('Auth Endpoints', () => {
  let db;

  const { testUsers } = helpers.makeThingsFixtures();
  const testUser = testUsers[0];

  before('Connect to DB before ALL tests', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    });
    app.set('db', db);
  });

  after('Disconnect from DB after ALL tests', () => db.destroy());

  before('Clear tables before ALL tests', () => helpers.cleanTables(db));

  afterEach('Clear table after EACH test', () => helpers.cleanTables(db));

  describe('POST /api/auth/login', () => {
    beforeEach('Insert users into table', () => helpers.seedUsers(db, testUsers));

    const requiredFields = ['user_name', 'password'];

    requiredFields.forEach(field => {
      const loginAttemptBody = {
        user_name: testUser.user_name,
        password: testUser.password
      };

      it(`responds with 400 required error when ${field} is missing`, () => {
        delete loginAttemptBody[field];

        return supertest(app)
          .post('/api/auth/login')
          .send(loginAttemptBody)
          .expect(400, {error: `Missing ${field} in request body`});
      });
    });

    it('returns 400 with invalid user_name or password when bad user_name', () => {
      const invalidUser = { user_name: 'wrong', password: 'whatever'};
      return supertest(app)
        .post('/api/auth/login')
        .send(invalidUser)
        .expect(400, {error: 'Incorrect user_name or password'});
    });

    it('returns 400 with invalid user_name or password when bad password', () => {
      const user = testUser.user_name;
      const invalidPassword = { user_name: user, password: 'incorrect' };
      return supertest(app)
        .post('/api/auth/login')
        .send(invalidPassword)
        .expect(400, {error: 'Incorrect user_name or password'});
    });

    it('responds 200 and JWT auth token using secret when valid credentials', () => {
      const validUserCreds = { user_name: testUser.user_name, password: testUser.password };
      const expectedToken = jwt.sign({
        user_id: testUser.id}, 
      process.env.JWT_SECRET, 
      {subject: testUser.user_name, algorithm: 'HS256'}); // (PAYLOAD, SECRET, CONFIG OBJECT)

      return supertest(app)
        .post('/api/auth/login')
        .send(validUserCreds)
        .expect(200, {authToken: expectedToken});
    });
  }); //CLOSES DESCRIBE POST ENDPOINT


}); // CLOSES DESCRIBE AUTH ENDPOINTS