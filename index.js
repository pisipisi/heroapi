
var express = require('express');
var app = express();
var cors = require('cors');
var createError = require('http-errors');
var port = process.env.PORT || 3000;
var http = require('http');
var server = http.createServer(app);
server.listen(process.env.PORT || 3000);
var io = require('socket.io')(server);
// app.use((req, res, next)=>{ res.locals['socketio'] = io; next(); });
// app.set('socketio', io);
require('./api/routes/socket')(app, io);
//app.use(socketRouter);

// catch 404 and forward to error handler

var usersRouter = require('./api/routes/user');
app.use(express.json());
app.use(cors())
app.use(express.urlencoded({ extended: false }));
app.use('/users', usersRouter);
app.use(function(req, res, next) {
    next(createError(404));
});
app.use(function(err, req, res, next) {
    res.status(err.status || 500).json({code: 500, message: err.message, error:  req.app.get('env') === 'development' ? err : {}});
});
console.log('todo list RESTful API server started on: ' + port);

// let app = require('express')();
// let http = require('http').Server(app);
// let io = require('socket.io')(http);
 
// io.on('connection', (socket) => {
  
//   socket.on('disconnect', function(){
//     io.emit('users-changed', {user: socket.nickname, event: 'left'});   
//   });
 
//   socket.on('set-nickname', (nickname) => {
//     socket.nickname = nickname;
//     console.log("got it", nickname);
//     io.emit('users-changed', {user: nickname, event: 'joined'});    
//   });
  
//   socket.on('add-message', (message) => {
//     io.emit('message', {text: message.text, from: socket.nickname, created: new Date()});    
//   });
  
// });
 
// var port = process.env.PORT || 3001;
 
// http.listen(port, function(){
//    console.log('listening in http://localhost:' + port);
// });