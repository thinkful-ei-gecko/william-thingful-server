const express = require('express');
const AuthService = require('./auth-service');

const authRouter = express.Router();
const jsonBodyParser = express.json();

authRouter
  .post('/login', jsonBodyParser, (req,res,next) => {
    const { user_name, password } = req.body;
    const loginUser = { user_name, password };
    
    if(!user_name) {
      return res.status(400).json({error: 'Missing user_name in request body'});
    }
    if(!password) {
      return res.status(400).json({error: 'Missing password in request body'});
    }
    
    const db = req.app.get('db');
    const username = loginUser.user_name;
    AuthService.getUserWithUserName(db,username)
      .then(dbUser => {
        if(!dbUser) {
          return res.status(400).json({error: 'Incorrect user_name or password'});
        }
        return AuthService.comparePasswords(loginUser.password, dbUser.password)
          .then(passwordsMatch => {
            if(!passwordsMatch) {
              return res.status(400).json({error: 'Incorrect user_name or password'});
            }
            const subject = dbUser.user_name; // This is WHO we are making the token for
            const payload = { user_id: dbUser.id };
            res.send({
              authToken: AuthService.createJwt(subject,payload)
            });
          });
      })
      .catch(next);
  });

module.exports = authRouter;