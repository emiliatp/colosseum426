const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const Room = require('./Room');

let connectedUsers = []; // array storing all users currently online. indexed by socket id
let usernames = [];      // array of usernames. indexed by socket id
let usersOnline = 0;     // count of how many users are connected to the website
let registry = []        // array of rooms where users are. indexed by socket id

let rooms = [];          // array of rooms. indexed by room name


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/client.js', (req, res) => {
    res.sendFile(__dirname + '/client.js');
});

app.get('/style.css', (req, res) => {
    res.sendFile(__dirname + '/style.css');
});

io.on('connection', (socket) => {

    // when a user connects, we do the following:
    // increment the # of people online by 1
    usersOnline++;
    // add user to array of connected users
    connectedUsers[socket.id] = socket;
    // when a user first connects they are not logged in/have not chosen a name yet
    // socket.loggedIn is not built in with sockets, I just made it up
    socket.loggedIn = false;  
    // start user with a guest name
    chooseName(socket, 'guest_'+socket.id.substring(0, 4));
    // put user in lobby
    socket.join('lobby');
    registry[socket.id] = 'lobby'; // registry keeps track of where people are
    // let everybody know the # of people online changed
    io.emit('online count', usersOnline);
    // let everybody know the guest list changed
    io.emit('new name list', Object.values(usernames));
    // let the new user know what rooms are available
    socket.emit('roomlist update', Object.keys(rooms));   

    // when the user disconnects, we do the following:
    socket.on('disconnect', () => {
        // decrement # of users online by 1
        usersOnline--;
        // let everybody know the # of users online changed
        io.emit('online count', usersOnline);
        // remove the user from the array of users online
        delete connectedUsers[socket.id];
        // remove the user's name from the array of usernames currently in use
        delete usernames[socket.id];
        // let everybody know the guest list changed
        io.emit('new name list', Object.values(usernames)); 
    });

    // when the user inputs a username, we do the following:
    socket.on('choose name', (name) => {
        // call chooseName
        chooseName(socket, name);
        // whatever happens, log them in
        socket.loggedIn = true;

        // currently this will sign in somebody using their guest name if they choose a
        // name already in use without any indication to the user that the name they chose
        // is already taken. but that doesnt matter too much since we're supposed to
        // have an actual login system instead of whatever this is
    });

    // when the user creates a room, we do the following:
    socket.on('create room', (roomName) => {
        roomName = roomName.replace(/\W /g,'').substring(0,20);
        if (rooms[roomName] == undefined && roomName != 'lobby'  && socket.loggedIn) {
            rooms[roomName] = new Room(socket, roomName);
        }

        io.emit('roomlist update', Object.keys(rooms));
    });

    // when the user joins a room, we do the following:
    socket.on('join room', (roomName) => {
        if (rooms[roomName] != undefined && socket.loggedIn) {
            rooms[roomName].userJoin(socket);
            registry[socket.id] = roomName;
            io.in(roomName).emit('room userlist', rooms[roomName].userList);
            socket.emit('chat update', rooms[roomName].chatlog);
        }
    });

    // when the user leaves a room they joined, we do the following:
    socket.on('leave room', (roomName) => {
       if (rooms[roomName] != undefined) {
           rooms[roomName].userLeave(socket);
           registry[socket.id] = 'lobby';
           io.in(roomName).emit('room userlist', rooms[roomName].userList);
       }
    });

    // when the user sends a message, we do the following:
    socket.on('send message', (message) => {
        let roomName = registry[socket.id];
        if (rooms[roomName] != undefined) {
            rooms[roomName].message(socket, message);
            io.in(roomName).emit('chat update', rooms[roomName].chatlog);
        }
    });

});

// HOW TO SET A USER'S USERNAME //////////////////////////////
let chooseName = (socket, name) => {                        
    name = name.replace(/\W/g,'').substring(0,20);          // remove nonalphanumeric characters from the name

    if(!Object.values(usernames).includes(name) && !socket.loggedIn) {          // check to see if the username is currently in use
        usernames[socket.id] = name;                        // put the new name in the username list
        socket.userName = name;                             // give the socket a 'userName' property
        io.emit('new name list', Object.values(usernames)); // let everybody know the updated name list
    }

}  

http.listen(3000, () => {
    console.log('listening on *:3000');
});