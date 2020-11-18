class Room {
    constructor(creatorSocket, roomName) {
        this.userList = [];
        this.roomName = roomName;
        this.chatlog = [];
    }

    userJoin(socket) {
        if (!this.userList.includes(socket.userName)) {
            this.userList.push(socket.userName);
            socket.join(this.roomName);
            socket.leave('lobby');
        }
    }

    userLeave(socket) {
        let index = this.userList.indexOf(socket.userName);
        if (index > -1) {
            this.userList.splice(index, 1);
            socket.leave(this.roomName);
            socket.join('lobby');
        }
    }

    message(socket, message) {
        if (this.userList.includes(socket.userName)) {
            message = message.replace(/[^a-zA-Z0-9 .,!?#$%^&*()+=_'";:/~-]/g, '');
            this.chatlog.push(`${socket.userName}: ${message}`);
            if (this.chatlog.length > 25) {
                this.chatlog.shift();
            }
        }
    }
}
 
module.exports = Room;