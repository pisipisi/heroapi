var express = require('express');
var crypto = require('crypto');
var router = express.Router();
var jwt = require('jsonwebtoken');
var VerifyToken = require('../auth/VerifyToken');
var pool = require('../auth/database');
var randtoken = require('rand-token');
var refreshTokens = {};
var config = require('../../config');
router.post('/fblogin', async function(req, res, next) {
    let sql = "SELECT id, email, password FROM users WHERE email=?";
    var results = await pool.query(sql, [req.body.email.toLowerCase()]);
    if(results[0]) {
        
        let user = results[0];
        if(user.approved === 1) {
            var refreshToken = randtoken.uid(256);
            refreshTokens[refreshToken] = user.id;
            var token = jwt.sign({ id: user.id }, config.secret, {
                expiresIn: 86400 // expires in 24 hours
            });
            res.status(200).json({code: 200, error: null, token: token, user:user.id, expiresIn: 86400, refreshToken: refreshToken});
        }  else {
            res.status(404).json({code: 404, message: "Account waiting for approval", error: null});
        }
        
    } else {
        var names = req.body.name.split(' ');
        let firstName = names[0];
        let lastName = names[1];
        let user = await pool.query("INSERT INTO users (email, firstname, lastname) VALUES (?, ?, ?)", [req.body.email.toLowerCase(), firstName, lastName]);
        res.status(404).json({code: 404, error: null, message: "Thanks for register, please wait for the approval.", new: true});
    }
});
router.post('/login', async function(req, res, next) {
    try {
        let sql = "SELECT id, email, password FROM users WHERE email=?";
        console.log(req.body);
        var results = await pool.query(sql, [req.body.email.toLowerCase()]);
        if(results[0]) {
            let user = results[0];
            let salt = user.password.substring(0, 64);
            let hash = user.password.substring(64);
            let password_hash = crypto.createHash('sha256').update(salt+req.body.password).digest('hex');
            if(password_hash === hash) {
                var refreshToken = randtoken.uid(256);
                refreshTokens[refreshToken] = user.id;
                var token = jwt.sign({ id: user.id }, config.secret, {
                    expiresIn: 86400 // expires in 24 hours
                });
                res.status(200).json({code: 200, error: null, token: token, user:user.id, expiresIn: 86400, refreshToken: refreshToken});
            } else {
            res.status(404).json({code: 404, message: "Wrong Password or Username", error: null});
            }
        } else {
            res.status(404).json({code: 404, message: "Wrong Password or Username", error: null});
        }
    } catch (err) {
        next(err);
    }
});
module.exports = router;