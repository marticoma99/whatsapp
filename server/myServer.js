var WebSocketServer = require('websocket').server;
var http = require('http');
var url = require('url');
var usersPositions = [];
var oldUsers = [];

var USERS = [];

var width = 1024;
var height = 1024;

var server = http.createServer(function (request, response) {
});
server.listen(9012, function () { }); //here the port is 1337, but this can be changed as you wish

// create the WebSocket Server
wsServer = new WebSocketServer({ httpServer: server });

function map_range(value, definedSize, actualSize) {
    return (value * actualSize) / definedSize;
}

// Add event handler when one user connects
wsServer.on('request', function (request) {
    var connection = request.accept(null, request.origin);
    onUserConnected(connection);
    // This is the most important callback for us, we'll handle all messages from users here.
    connection.on('message', function (message) {
        if (message.type === 'utf8') {
            var messageText = JSON.parse(message.utf8Data);
            if (messageText.type == "initialInfo") {
                newUser(connection, messageText, false);
            }
            if (messageText.type == "updateTArgetPosition") {
                sendMessage(connection, message.utf8Data);
                updatTargetPosition(messageText);
            }
            if (messageText.type == "updateCurrentPosition") updateUserCurrentPosition(messageText, connection);
            if (messageText.type == "text") sendMessageClose(connection, message.utf8Data);
            if (messageText.type == "room_change") chengeRoom(connection, messageText);
            if (messageText.type == "updateCanvasSize") updateCanvasSizes(messageText, connection);
        }
    });
    connection.on('close', function () {
        deleteUser(connection, false);
    });
});

function updateCanvasSizes(messageText, connection){
    var modifiedUser = USERS.find(function(c){return c.connection == connection});
    modifiedUser.canvasW = messageText.w;
    modifiedUser.canvasH = messageText.h;
}

function send(connection, message, room) {
    var roomConnected = USERS.find(function (c) { return c.connection == connection }).room;
    if (roomConnected == room)
        connection.send(message);
}

function chengeRoom(connection, messageText) {
    deleteUser(connection, true);
    var userChenged = usersPositions.find(function (c) { return c.connection == connection });
    var userConnection = USERS.find(function (c) { return c.connection == connection });
    userChenged.content.room = messageText.roomNumber;
    userConnection.room = messageText.roomNumber;
    newUser(connection, userChenged, true);
}

function newUser(connection, messageText, roomChenge) {
    var user = messageText.content;
    var connectionUser = USERS.find(function (c) { return c.connection == connection });
    if (!roomChenge) {
        for (var i = 0; i < oldUsers.length; i++) {
            if (oldUsers[i].name == user.name) {
                user.x = oldUsers[i].x;
                user.y = oldUsers[i].y;
                user.targetx = oldUsers[i].targetx;
                user.targety = oldUsers[i].targety;
                messageText.content.x = oldUsers[i].x;
                messageText.content.y = oldUsers[i].y;
                user.room = oldUsers[i].room;
                connectionUser.room = user.room;
                var messageToSend = {
                    type: "userModified",
                    content: user
                }
                connection.send(JSON.stringify(messageToSend))
            }
        }
    }
    var messageToSend2 = {
        type: "initialInfo",
        content: user,
    }
    sendMessage(connection, JSON.stringify(messageToSend2));
    if (!roomChenge) usersPositions.push(formatUserPosition(user, connection));

    connection.send(sendUsersConnected(user.room, user.name));
}

function updateUserCurrentPosition(messageText, connection) {
    for (var i = 0; i < usersPositions.length; i++) {
        var ch = usersPositions[i];
        if (ch.connection == connection) {
            usersPositions[i].content.x = messageText.x;
            usersPositions[i].content.y = messageText.y;
            return;
        }
    }
}

function updatTargetPosition(messageText) {
    for (var i = 0; i < usersPositions.length; i++) {
        var ch = usersPositions[i];
        if (ch.content.name == messageText.name) {
            usersPositions[i].content.targetx = messageText.x;
            usersPositions[i].content.targety = messageText.y;
            return;
        }
    }
}

function formatUserPosition(messageRecived, connecttion) {
    var mesageToStore = {
        connection: connecttion,
        content: messageRecived
    }
    return mesageToStore
}

//call this when somebody connects to your WebsocketServer
function onUserConnected(connection) {
    //store user connection in container
    var newUser = {
        connection: connection,
        room: -1,
        canvasW: 0,
        canvasH: 0
    }
    USERS.push(newUser);
}

function sendUsersConnected(room, name) {
    var msg = {
        type: "userConnectedPositions",
        content: usersPositions.map(obj => obj.content).filter(function (c) { return c.room == room }).filter(function (c) { return c.name != name }),
    };
    return JSON.stringify(msg);
}

//call when we receive a message from a WebSocket
function sendMessage(connection, msg) {
    //for every user connected...
    var room = USERS.find(function (c) { return c.connection == connection }).room;
    for (var i = 0; i < USERS.length; i++) {
        var user = USERS[i].connection;
        //avoid feedback
        if (user != connection)
            send(user, msg, room);
    }
}

function sendMessageClose(connection, msg) {
    //for every user connected...
    var positionSender = usersPositions.find(function (c) { return c.connection == connection }).content;
    userGeneral = USERS.find(function (c) { return c.connection == connection });
    var room = userGeneral.room;
    for (var i = 0; i < USERS.length; i++) {
        var user = USERS[i].connection;
        var positionReciver = usersPositions.find(function (c) { return c.connection == user }).content;
        //avoid feedback
        if (user != connection && distanceBetweenUsers(map_range(positionSender.x, userGeneral.canvasW, width), map_range(positionSender.y, userGeneral.canvasH, height), map_range(positionReciver.x, userGeneral.canvasW, width), map_range(positionReciver.y, userGeneral.canvasH, height)) < 220)
            send(user, msg, room);
    }
}

function distanceBetweenUsers(x1, y1, x2, y2) {
    x = Math.pow(x2 - x1, 2);
    y = Math.pow(y2 - y1, 2);

    return Math.sqrt(x + y);
}

function deleteUser(connection, chengeRoom) {
    for (var i = 0; i < usersPositions.length; i++) {
        var ch = usersPositions[i];
        if (ch.connection == connection) {
            var msg = {
                type: "userDesconnected",
                name: (ch.content.name),
            };
            sendMessage(connection, JSON.stringify(msg));
            if (!chengeRoom) {
                saveUser(ch.content);
                usersPositions.splice(i, 1);
            }
        }
    }
    if (!chengeRoom) {
        for (var i = 0; i < USERS.length; i++) {
            var user = USERS[i].connection;
            if (user == connection)
                USERS.splice(i, 1);
        }
    }
}

function saveUser(ch) {
    for (var i = 0; i < oldUsers.length; i++) {
        if (oldUsers[i].name == ch.name) {
            oldUsers[i] = ch;
            return;
        }
    }
    oldUsers.push(ch);
}