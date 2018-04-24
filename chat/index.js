// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('../')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

// Chatroom

var numUsers = 0;

//ประกาศตัวแปรเพื่อเก็บค่ามาโชว์ใน Users Online
var users = [];

io.on('connection', function (socket) {
  var addedUser = false;


  socket.on('change_username', function(data){

    //Check ค่า ถ้ามีการเปลี่ยนแปลงชื่อของผู้ใช้
    if(data.newUsername){
    socket.username = data.newUsername
    }

    //ถ้ามีการเปลี่ยนแปลงชื่อให้ทำการ Splice ชื่อเก่าออก
    if(data.oldUsername){
    for( var i = users.length - 1; i >= 0; --i){
      if(data.oldUsername == users[i]){
        users.splice(i,1);
      }
    }
    // ทำการ Push ชื่อใหม่เข้าไปใน Array
    users.push(data.newUsername);

    //Emit ฺbroadcast Show user เพื้ออัพเดทชื่่อที่กำลังออนไลน์อยู่
    socket.broadcast.emit('show_user', {
      users : users
    });

    //Emit ฺbroadcast Show user เพื้ออัพเดทชื่่อที่กำลังออนไลน์อยู่
    socket.emit('show_user', {
      users : users
    });
  }
    
    //Check ค่า ถ้ามีการเปลี่ยนชื่อของผู้ใช้
    if(data.newUsername){
    // Emit เพื่อบอกคนอื่นว่าผู้ใช้คนนี้ได้ทำการเปลี่ยนชื่อ
    socket.broadcast.emit('user_changed_name', {
      oldUsername: data.oldUsername,
      newUsername: socket.username
    });
  }

  })
  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    //ทำการ Push User เมื่อเข้าสู่ระบบครั้งแรก
    users.push(socket.username);

    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers,
      users : users
    });

    //Emit ฺbroadcast Show user เพื้ออัพเดทชื่่อที่กำลังออนไลน์อยู่
    socket.broadcast.emit('show_user', {
      users : users
    });

    //Emit Show user เพื้ออัพเดทชื่่อที่กำลังออนไลน์อยู่
    socket.emit('show_user', {
      users : users
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;
      //เมื่อ User ทำการ Disconnect ให้ spice ชื่อออก
      for( var i = users.length - 1; i >= 0; --i){
        if(socket.username == users[i]){
          users.splice(i,1);
        }
      }

      //และทำการอัพเดทผู้ใช้ออนไลน์ในขณะนั้น
      socket.broadcast.emit('show_user', {
        users : users
      });

      //อัพเดทผู้ใช้ออนไลน์
      socket.emit('show_user', {
        users : users
      });
      
      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});
