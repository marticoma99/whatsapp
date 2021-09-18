var loginZone = document.querySelector(".loginZone");
loginZone.style.display = " ";
var frame_1 = 0;

var app = document.querySelector("#application");
app.style.display = "none";

var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");
var characterName = "";
var t = document.querySelector("#sendButton");
var inputText = document.querySelector("#textMessage");
var avatarName = "avatars/avatar1.png"; //init

var server = new WebSocket("wss://ecv-etic.upf.edu/node/9012/ws/");

function room(id, name, spritesheet, w, h, frames, max_y, fps){
    this.id = id;
    this.name = name;
    this.spritesheet = spritesheet;
    this.width = w;
    this.height = h;
    var anim = [];
    for(var i = 0; i < frames; i++){
        anim.push(i);
    }
    this.frames = anim;
    this.max_y = max_y; //the character will not walk in values under this one
    this.fps = fps;
}

var city1 = new room(0, "Cyber City","sprites/ciberpunk.png", 960, 640, 69, 517, 16);
var city2 = new room(1, "Sin City","sprites/cyberpunk2.png", 480, 320, 98, 263, 16);
var city3 = new room(2, "Liberty City","sprites/city3.png", 960, 640, 71, 524, 16);
var city4 = new room(3, "UPF City","sprites/city4.png", 960, 640, 60, 523, 16);

//in order to store connected characters
var DB = {
    characters: [],
    map: "sprites/fondo2.png",
    sprites: ["sprites/man1-spritesheet.png", "sprites/man2-spritesheet.png",
        "sprites/man3-spritesheet.png", "sprites/man4-spritesheet.png",
        "sprites/woman1-spritesheet.png", "sprites/woman2-spritesheet.png",
        "sprites/woman3-spritesheet.png", "sprites/woman4-spritesheet.png"],
    room:[city1, city2, city3, city4]
}

var idle = [17];

var walk = [2, 3, 4, 5, 6, 7, 8, 9];

function create_character(name, spritesheet, x, y) {
    var character = {
        name: name,
        spritesheet: spritesheet,
        animation: idle,
        flip: false,
        w: 32,
        h: 64,
        x: x,
        y: y,
        targetx: x,
        targety: y,
        vec_x: 0,
        vec_y: 0,
        scale: 2,
        canvasW: canvas.width,
        canvasH: canvas.height,
        send_text_msg: false,
        time: 0, 
        room: 0,
    }
    return character;
}

//msg manager
server.onmessage = function onMessageReceived(str_msg) {
    var mesageRecived = JSON.parse(str_msg.data);
    console.log("received message:", mesageRecived.type);
    if (mesageRecived.type == "updateTArgetPosition") {
        console.log(mesageRecived);
        for (var i = 0; i < DB.characters.length; i++) {
            var ch = DB.characters[i];
            if (ch.name == mesageRecived.name) {
                DB.characters[i].targetx = mesageRecived.x;
                DB.characters[i].targety = mesageRecived.y;
                DB.characters[i].vec_x = DB.characters[i].targetx - DB.characters[i].x;
                DB.characters[i].vec_y = DB.characters[i].targety - DB.characters[i].y;
                DB.characters[i].flip = flip(DB.characters[i].x, DB.characters[i].targetx);
                return;
            }
        }
    }
    if (mesageRecived.type == "userConnectedPositions") {
        DB.characters.push.apply(DB.characters, mesageRecived.content);
        console.log(mesageRecived);
    }
    if (mesageRecived.type == "initialInfo") {
        DB.characters.push(mesageRecived.content);
        console.log(mesageRecived);
    }
    if (mesageRecived.type == "userDesconnected") {
        console.log(mesageRecived);
        for (var i = 0; i < DB.characters.length; i++) {
            var ch = DB.characters[i];
            if (ch.name == mesageRecived.name) {
                DB.characters.splice(i, 1);
            }
        }
    }
    if(mesageRecived.type == "userModified"){
        console.log(mesageRecived);
        for (var i = 0; i < DB.characters.length; i++) {
            var ch = DB.characters[i];
            if (ch.name == mesageRecived.content.name) {
                DB.characters[i].x = mesageRecived.content.x;
                DB.characters[i].y = mesageRecived.content.y;
                DB.characters[i].targetx = mesageRecived.content.x;
                DB.characters[i].targety = mesageRecived.content.y;
                DB.characters[i].vec_x = 0;
                DB.characters[i].vec_y = 0;
                DB.characters[i].spritesheet = mesageRecived.content.spritesheet;
                DB.characters[i].room = mesageRecived.content.room;
            }
        }
    }
    if (mesageRecived.type == "text") {
        //message sended effect
        for (var i = 0; i < DB.characters.length; i++) {
            if(DB.characters[i].name == mesageRecived.username){
                DB.characters[i].send_text_msg = true;
            }
        }
        putMessage(mesageRecived.content, mesageRecived.username, mesageRecived.avatar, true);
    }
}

//maps a value from one domain to another
function map_range(value, definedSize, actualSize) {
    return (value * actualSize) / definedSize;
}

//images container
var imgs = {};

//example of images manager
function getImage(url) {
    //check if already loaded
    if (imgs[url])
        return imgs[url];


    //if no loaded, load and store
    var img = imgs[url] = new Image();
    img.src = url;
    return img;
}

function draw_map() {
    var room = DB.room[character.room];
    var img = getImage(room.spritesheet);
    renderAnimation(img, room.frames, 0, 0, 1, 0, false, room.width, room.height, character, false, room.fps, true);
}


function draw() {
    var parent = canvas.parentNode;
    var rect = parent.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    draw_map();
    for (var i = 0; i < DB.characters.length; i++) {
        var ch = DB.characters[i];

        //avoid draw those characters that are not in the user room
        if(ch.room != character.room)
            continue;

        var img = getImage(ch.spritesheet);
        renderAnimation(img, ch.animation, ch.x, ch.y, ch.scale, 0, ch.flip, ch.w, ch.h, ch, false, 8, false);
        if(ch.send_text_msg){
            var send_effect = getImage("sprites/send_effect.png");
            renderAnimation(send_effect, [0,1,2,3,4,5], ch.x, ch.y, 1, 0, false, 128, 128, ch, true, 8, false);
        }
    }
}

function renderAnimation(image, anim, x, y, scale, offset, flip, w, h, ch, send, fps, bg) {
    offset = offset || 0;
    var t = Math.floor(performance.now() * 0.001 * fps);
    renderFrame(image, anim[t % anim.length] + offset, x, y, scale, flip, w, h, ch, send, bg);
}

function renderFrame(image, frame, x, y, scale, flip, w, h, ch, send, bg) {
    scale = scale || 1;
    var num_hframes = image.width / w;
    var xf = (frame * w) % image.width;
    var yf = Math.floor(frame / num_hframes) * h;
    ctx.save();
    var send_effect_center = 0;

    if(send)
        send_effect_center = w/4;

    ctx.translate(map_range(x, ch.canvasW, canvas.width)-send_effect_center, map_range(y, ch.canvasH, canvas.height));

    if(!send){
        ctx.font = '16px Roboto';
        ctx.fillStyle = 'white';
        ctx.fillText(ch.name, 0, 0);
    }
    
    if (flip) {
        ctx.translate(w * scale, 0);
        ctx.scale(-1, 1);
    }

    ctx.imageSmoothingEnabled = false;

    if(!bg)
        ctx.drawImage(image, xf, yf, w, h, 0, 0, w * scale, h * scale);
    else
        ctx.drawImage(image, xf, yf, w, h, 0, 0, canvas.width, canvas.height);

    ctx.restore();
}

function move(ch, dt) {
    if (ch.x == ch.targetx && ch.y == ch.targety || ch.vec_x == 0 && ch.vec_y == 0) {
        ch.animation = idle;
    } else {
        ch.animation = walk;
        ch.x += ch.vec_x * 0.005;
        ch.y += ch.vec_y * 0.005;
        if (distance(ch.x, ch.targetx, ch.y, ch.targety) < 5) {
            ch.x = ch.targetx;
            ch.y = ch.targety;
            ch.vec_x = 0;
            ch.vec_y = 0;
        }
        if (ch.name == characterName) {
            var messageToSend = {
                type: "updateCurrentPosition",
                x: ch.x,
                y: ch.y
            };
            server.send(JSON.stringify(messageToSend));
        }
    }
}

function distance(x, tx, y, ty) {
    return Math.sqrt((tx - x) ** 2 + (ty - y) ** 2);
}

//in order to draw them in the correct order
function sort_characters() {
    DB.characters.sort(function (a, b) {
        var a_y = map_range(a.y, a.canvasH, canvas.height);
        var b_y = map_range(b.y, b.canvasH, canvas.height);
        if (a_y > b_y) {
            return 1;
        }
        if (a_y < b_y) {
            return -1;
        }
        return 0;
    });
}

function update(elapsed_time) {
    //frame 1 initialization
    if(frame_1 == 0){
        //get correct canvas size and send the character information to the other users
        character.canvasW = canvas.width; character.canvasH = canvas.height;
        character.x = 20; character.y = canvas.height - character.h*character.scale;
        frame_1++;
        var messageToSend = {
            content: character,
            type: "initialInfo"
        }
        server.send(JSON.stringify(messageToSend));
        console.log("Character Canvas updated");
        setInterval(send_canvasSize,1000);
    }
    sort_characters();
    for (var i = 0; i < DB.characters.length; i++) {
        var ch = DB.characters[i];
        move(ch, elapsed_time);

        if(ch.send_text_msg){
            ch.time+=elapsed_time;
            if(ch.time > 4){
                ch.time=0;
                ch.send_text_msg = false;
            }
        }
    }
}

function send_canvasSize(){
    var messageToSend = {
        type: "updateCanvasSize",
        w: canvas.width,
        h: canvas.height
    };
    server.send(JSON.stringify(messageToSend));
}


function flip(x, targetx) {
    if (targetx - x < 0) {
        return true;
    }
    return false;
}

var mouse_pos = [0, 0];
var clicked = false;

function onMouse(event) {

    var rect = canvas.getBoundingClientRect();
    var canvasx = mouse_pos[0] = event.clientX - rect.left;
    var canvasy = mouse_pos[1] = event.clientY - rect.top;

    if(canvasx > canvas.width || canvasy > canvas.height || canvasx < 0 || canvasy < 0){
        return;
    }

    canvasx = map_range(canvasx, canvas.width, character.canvasW);
    canvasy = map_range(canvasy, canvas.height, character.canvasH);

    if (event.type == "mousedown") {
        //to avoid that the character moves outside the canvas 
        if (canvasx >= character.canvasW - character.w * character.scale) {
            canvasx = character.canvasW - character.w * character.scale;
        } else if (canvasx <= 0) {
            canvasx = character.w * character.scale;
        }
        if (canvasy < map_range(DB.room[character.room].max_y, DB.room[character.room].height,canvas.height)) {
            canvasy = map_range(DB.room[character.room].max_y, DB.room[character.room].height,canvas.height);
        } else if (canvasy > character.canvasH) {
            canvasy = character.canvasH - character.h * character.scale;
        }
        //assign target
        character.targetx = canvasx;
        character.targety = canvasy - character.h * character.scale;
        //movement vector
        character.vec_x = (character.targetx - character.x);
        character.vec_y = (character.targety - character.y);
        //flip or not
        character.flip = flip(character.x, character.targetx);
        clicked = true;

        var messageToSend = {
            type: "updateTArgetPosition",
            name: character.name,
            x: character.targetx,
            y: character.targety
        }
        server.send(JSON.stringify(messageToSend));
    }
};

document.body.addEventListener("mousedown", onMouse);

//last stores timestamp from previous frame
var last = performance.now();

function loop() {
    draw();

    //to compute seconds since last loop
    var now = performance.now();
    //compute difference and convert to seconds
    var elapsed_time = (now - last) / 1000;
    //store current time into last time
    last = now;

    //now we can execute our update method
    update(elapsed_time);

    //request to call loop() again before next frame
    requestAnimationFrame(loop);
}
/**************************************************************/

//handling text messages
/**************************************************************/
t.addEventListener("click", sendOwnMessage);
inputText.addEventListener("keydown", keyPresedEvent);

function sendAndShowOwnMessage(messageToShow) {
    putMessage(messageToShow.value, characterName, avatarName, false);
    var message2send = formatMessage("text", messageToShow.value);
    server.send(message2send);
    messageToShow.value = "";
}

function sendOwnMessage() {
    var textInput = document.querySelector("#textMessage");
    sendAndShowOwnMessage(textInput);
    character.send_text_msg = true;
}

function putMessage(messageToShow, senderToShow, avatarPicture, isReciver) {
    var elem = document.createElement("div");
    var message = document.createElement("div");
    var chat = document.querySelector("#allMsg");

    elem.innerText = messageToShow;

    if (isReciver) {
        elem.className = "pChatResponse";
        var avatarPhoto = document.createElement("img");
        avatarPhoto.className = "chatAvatarResponse";
        avatarPhoto.src = avatarPicture;

        var messageName = document.createElement("div");
        messageName.className = "messageContact"
        messageName.innerText = senderToShow;

        var mesageAndContact = document.createElement("div");
        mesageAndContact.className = "messageAndContact"

        message.className = "chatMessasgeResponse";
        mesageAndContact.appendChild(messageName);
        mesageAndContact.appendChild(elem);
        message.appendChild(mesageAndContact);
        message.appendChild(avatarPhoto);
    }
    else {
        elem.className = "pChat"

        var avatarPhoto = document.createElement("img");
        avatarPhoto.className = "chatAvatar";
        avatarPhoto.src = avatarPicture;

        message.className = "chatMessasge"
        message.appendChild(avatarPhoto);
        message.appendChild(elem);
    }

    chat.appendChild(message);
    document.querySelector(".chat").scrollTop = 10000000;
}

function formatMessage(typeToSend, textToSend) {
    var msg = {
        type: typeToSend,
        content: textToSend,
        username: characterName,
        avatar: avatarName
    };
    return JSON.stringify(msg);
}

function keyPresedEvent(event) {
    if (event.keyCode == 13) {
        sendAndShowOwnMessage(this);
        character.send_text_msg = true;
    }
}
/**************************************************************/

//login
/**************************************************************/
var character = create_character(characterName, DB.sprites[5], 0, 0);//character initialization
DB.characters.push(character);


changeAvatar();
var selectedAvatar = document.querySelector("#selectionAvatar");
var buttomLogin = document.querySelector("#login-submit");
buttomLogin.addEventListener("click", loginchat);
selectedAvatar.addEventListener("change", changeAvatar);



function loginchat() {
    app.style.display = "";
    var tempUserName = document.querySelector("#userNameInput").value;
    if (tempUserName) characterName = tempUserName;
    else characterName = "Anonymous"

    var selected_avatar = document.querySelector("#selectionAvatar").value-1;

    //get character new info
    character.name = characterName; character.spritesheet = DB.sprites[selected_avatar];
    character.x = 20; character.y = 450;

    loginZone.style.display = "none";
    app.style.display = "";

    document.querySelector("#userNameInput").value = "";

    //start loop
    loop();
}

function changeAvatar(){
    var avatarImageVar = document.querySelector("#avatarImage");
    avatarName = "avatars/avatar" + document.querySelector("#selectionAvatar").value + ".png";
    avatarImageVar.src = avatarName;
    avatarImage = avatarName;
}
/**************************************************************/

//rooms
/**************************************************************/
var change_room = document.querySelector("#room_change");
change_room.addEventListener("click", change_the_room);

function change_the_room(){
    if(character.room < DB.room.length-1){
        character.room++;
    }else{
        character.room = 0;
    }
    if(character.y < map_range(DB.room[character.room].max_y,DB.room[character.room].h,canvas.height)){
        character.y = map_range(DB.room[character.room].max_y,DB.room[character.room].h,canvas.height)-character.h*character.scale;
    }
    character.targetx = character.x; character.targety = character.y;
    var msg = {
        type: "room_change",
        roomNumber: character.room
    }
    server.send(JSON.stringify(msg));
    var room_title = document.querySelector("#actual_room_name");
    room_title.innerText = DB.room[character.room].name;

    thisCharacter = DB.characters.find(function (c) { return c.name == characterName });
    DB.characters = [];
    DB.characters.push(thisCharacter);
}
/**************************************************************/