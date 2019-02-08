var pool = require('../auth/database');

module.exports = function(app, io) {
    var helps = [];
    var helpers = [];
    io.on('connection', function(socket) {
        console.log('connected!', socket.id);

        socket.on('disconnect', function(socket){
            for(var i = helpers.length - 1; i > -1 ; i-- ) {           
                if(helpers[i].socketid == socket.id)
                    helpers.splice(i, 1);
            }
            io.emit('users-changed', {user: socket.nickname, event: 'left'});   
        });

        socket.on('helper-open-map', async function(helper) {
            socket.location = helper.location;
            socket.helperid = helper.id;
            helper.socketid = socket.id;
            helpers.push(helper);
            console.log(helper);
            let sql = "SELECT * FROM helps WHERE helper IS NULL LIMIT 1;UPDATE users SET lat=?, lng=? WHERE id=?";
            try {
                let result = await pool.query(sql, [helper.location.lat, helper.location.lng, helper.id]);
                if(result[0].length > 0) {
                    let help = result[0][0];
                    let baseRad = Math.PI * help.lat / 180;
                    let targetRad = Math.PI * helper.location.lat / 180;
                    let theta = help.lng - helper.location.lng;
                    let thetaRad = Math.PI * theta / 180;
                    let dist = Math.sin(baseRad) * Math.sin(targetRad) + Math.cos(baseRad) * Math.cos(targetRad) * Math.cos(thetaRad);
                    dist = Math.acos(dist);
                    dist = dist * 180 / Math.PI;
                    dist = dist * 60 * 1.1515;
                    dist = dist / 1.609344;
                    if(dist < 30) {
                        help.distance = dist;
                        console.log(help);
                        io.to(`${socket.id}`).emit('help-send', help);
                    }
                }
            } catch (err) {
                console.log(err);
            }
        });

        socket.on('set-nickname', (nickname) => {
            socket.nickname = nickname;
            io.emit('users-changed', {user: nickname, event: 'joined'});    
        });

        socket.on('create-help', async (help) => {
            if(!socket.helps) socket.helps = [];
            help.id = socket.id
            help.room = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            helps.push(help);
            try {
                await pool.query("INSERT INTO helps (socketid, room, lat, lng, note, phone, active) VALUES (?, ?, ?, ?, ?, ?, 1)", [socket.id, help.room, help.location.lat, help.location.lng, help.note.note, help.note.phone ]);
            } catch (err) {
                console.log(err);
            }
            socket.join(help.room);

            for (var i = 0; i < helpers.length; i++) {
                let baseRad = Math.PI * help.location.lat / 180;
                let targetRad = Math.PI * helpers[i].location.lat / 180;
                let theta = help.location.lng - helpers[i].location.lng;
                let thetaRad = Math.PI * theta / 180;
                let dist = Math.sin(baseRad) * Math.sin(targetRad) + Math.cos(baseRad) * Math.cos(targetRad) * Math.cos(thetaRad);
                dist = Math.acos(dist);
                dist = dist * 180 / Math.PI;
                dist = dist * 60 * 1.1515;
                dist = dist / 1.609344;
                if(dist < 30) {
                    help.distance = dist;
                    
                    let data = help.note;
                    help.note = data.note;
                    help.phone = data.phone;
                    console.log(data);
                    io.to(`${helpers[i].socketid}`).emit('help-send', help);
                }
            }

          //  io.emit('help-send', help);
        });

        socket.on('helper-join', async (room) => {
            console.log(socket.location);
            let result = await pool.query("SELECT * FROM helps WHERE room=? AND helper IS NULL", [room]);

            if(result.length > 0) {
                socket.to(room).emit('helper-current-location', socket.location);
                try {
                    await pool.query("UPDATE helps SET helper=? WHERE room=?", [socket.helperid, room]);
                } catch (err) {
                    console.log(err);
                }
                socket.join(room);
            } else {
                io.to(`${socket.id}`).emit('help-already', help);
            }
            
        });

        socket.on('helper-leave', (room) => {
            socket.leave(room);
            socket.to(room).emit('helper-left', socket.id);
        });

        socket.on('cancel-help', (cancel) => {
            console.log(cancel);
            if(cancel && socket.helps) {
                for (var i = 0; i < helps.length; i++) {
                    var obj = socket.helps[i];
                
                    if (obj.id===socket.id) {
                        socket.leave(obj.room);
                        console.log(obj.room);
                        socket.to(obj.room).emit('help-canceled', socket.id);
                        helps.splice(i, 1);
                        break;
                    }
                }
            }
        })
    });
    
    
    
    // app.get('/foo', function() {
    //     ...
    // }
}
// router.get('/', function(req, res, next) {
//     let socket_id = [];
//    const io = req.app.get('socketio');

//    io.on('connection', socket => {
//       socket_id.push(socket.id);
//       if (socket_id[0] === socket.id) {
//         // remove the connection listener for any subsequent 
//         // connections with the same ID
//         io.removeAllListeners('connection'); 
//       }

//       socket.on('disconnect', function(){
//         io.emit('users-changed', {user: socket.nickname, event: 'left'});   
//       });
     
//       socket.on('set-nickname', (nickname) => {
//         socket.nickname = nickname;
//         console.log("got it", nickname);
//         io.emit('users-changed', {user: nickname, event: 'joined'});    
//       });
      
//       socket.on('add-message', (message) => {
//         io.emit('message', {text: message.text, from: socket.nickname, created: new Date()});    
//       });

//    });
// });
  
// module.exports = router;