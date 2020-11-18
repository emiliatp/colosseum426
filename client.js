//commeting to see if things will work
$(function () {
    let socket = io();
    let myName = '';
    let currentRoom = 'lobby';

    $('form.nameform').submit(function(e){
        e.preventDefault();
        socket.emit('choose name', $('#namefield').val());
        myName = $('#namefield').val();
        $('form.nameform').remove();
        $('.lobby').removeClass('hidden');
    });

    $('form.createroomform').submit(function(e){
        let roomname = $('#roomnamefield').val();
        e.preventDefault();
        socket.emit('create room', roomname);
        joinRoom(roomname);
    });

    $('form.chatform').submit(function(e) {
        e.preventDefault();
        let message = $('#chatmessagefield').val();
        $('#chatmessagefield').val('');
        socket.emit('send message', message);
    });

    socket.on('online count', function(usersOnline) {
        $('#oc').html(usersOnline);
    });

    socket.on('new name list', function(usernames) {
        let userList = usernames.reduce((acc, curr) => acc += `<br>${curr}`, '<h2>users online:</h2>');
        $('.everybodyonline').html(userList)
    });

    socket.on('roomlist update', function(rooms) {
        let roomList = rooms.reduce((acc, curr) => acc += `<br><button class="roombutton" id="room-${curr}">Join ${curr}</button>`, '<h2>available rooms to join:</h2>');
        $('.availablerooms').html(roomList);
    });

    socket.on('room userlist', function(usernames) {
        let userList = usernames.reduce((acc, curr) => acc += `<br>${curr}`, '<strong>users online:</strong>');
        $('.usersinroom').html(userList);
    });

    socket.on('chat update', function(chatlog) {
        let chat = chatlog.reduce((acc, curr) => acc += `<br>${curr}`, '<strong>chat history:</strong>');
        $('.chatbox').html(chat);
    });

    $('.availablerooms').on("click", ".roombutton", function(){
        let buttonid = $(this).attr('id');
        let roomname = buttonid.slice(5);
        joinRoom(roomname);
    });

    $('#leaveroombutton').click(function(){
        socket.emit('leave room', currentRoom);
        currentRoom = 'lobby';
        $('.lobby').removeClass('hidden');
        $('.roomchat').addClass('hidden');
    })

    function joinRoom(roomname) {
        currentRoom = roomname;
        socket.emit('join room', roomname);
        $('.lobby').addClass('hidden');
        $('.roomchat').removeClass('hidden');
    };
});