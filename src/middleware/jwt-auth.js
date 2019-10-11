const AuthService = require('../auth/auth-service');

function requireAuth(req,res,next) {
  const authToken = req.get('Authorization') || '';

  let bearerToken;
  if(!authToken.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({error: 'Missing bearer token'});
  } else {
    bearerToken = authToken.slice('bearer '.length, authToken.length);
  }

  // jwt.verify() THROWS an error, so we have to use a Try/Catch block or else it will crash our code
  try {
    const payload = AuthService.verifyJwt(bearerToken);
    // console.log(payload);

    const db = req.app.get('db');
    const username = payload.sub;
    AuthService.getUserWithUserName(db, username)
      .then(user => {
        if(!user) {
          return res.status(401).json({error: 'Unauthorized request'});
        }
        req.user = user;
        next();
      })
      .catch(err => {
        console.error(err);
        next(err);
      });
  } catch(error) {
    res.status(401).json({error: 'Unauthorized request'});
  }
}

module.exports = {
  requireAuth
};