var jwt = require('jsonwebtoken');
var config = require('../../config');
function verifyToken(req, res, next) {
  var token = req.headers['x-access-token'];
  if (!token)
    return res.status(403).send({ code: 403, auth: false, message: 'No token provided.' });
  jwt.verify(token, config.secret, function(err, decoded) {
    if (err)
      return res.status(403).send({ code: 403, auth: false, message: 'Failed to authenticate token.' });
    // if everything good, save to request for use in other routes
    req.id = decoded.id;
    req.cid = decoded.cid;
    if(decoded.store)
      req.store = decoded.store;
    next();
  });
}

module.exports = verifyToken;