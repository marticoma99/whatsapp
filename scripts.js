var roomName = "Default";
var userName = "Default Name";
var avatarImage = "";
var oldMessages = [];
var isSomeoneWriting = false;

var server = new SillyClient();

var t = document.querySelector("#sendButton");
var inputText = document.querySelector("#textMessage");
var buttomLogin = document.querySelector("#login-submit");
var selectedAvatar = document.querySelector("#selectionAvatar");

changeAvatar();

t.addEventListener("click", sendOwnMessage);
inputText.addEventListener("keydown", keyPresedEvent);
buttomLogin.addEventListener("click", loginchat);
selectedAvatar.addEventListener("change", changeAvatar);

server.on_message = function onMessageReceived(author_id, str_msg) {
    var mesageRecived = JSON.parse(str_msg);
    if (mesageRecived.type == "text") {
        putMessage(mesageRecived.content, mesageRecived.username, mesageRecived.avatar, true);
        oldMessages.push(mesageRecived);
    }
    if (mesageRecived.type == "history") {
        oldMessages = mesageRecived.content;
        showOldMessages();

        var msg2send2 = formatMessage("newUser", "");
        server.sendMessage(msg2send2);
    }
    if (mesageRecived.type == "typing" && !isSomeoneWriting) {
        isSomeoneWriting = true;
        isWritting(mesageRecived.username);
        setTimeout(deleteIsWritting, 2500);
    }
    if (mesageRecived.type == "newUser") {
        showJoinTheRoom(mesageRecived.username);
    }
}

server.on_user_connected = function sendOldMessages(author_id) {
    var firstid = Object.keys(server.clients).map(Number).sort()[0];
    if(firstid == Number(server.user_id)){
        var msg2send = formatMessage("history", oldMessages);
        server.sendMessage(msg2send, author_id);
    }
}

function sendAndShowOwnMessage(messageToShow) {
    putMessage(messageToShow.value, userName, avatarImage, false);
    var message2send = formatMessage("text", messageToShow.value);
    server.sendMessage(message2send);
    messageToShow.value = "";
}

function sendOwnMessage() {
    var textInput = document.querySelector("#textMessage");
    sendAndShowOwnMessage(textInput);
}

function keyPresedEvent(event) {
    if (event.keyCode == 13) {
        sendAndShowOwnMessage(this);
    } else {
        var message2send = formatMessage("typing", "");
        server.sendMessage(message2send);
    }
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

function showOldMessages() {
    for (var i in oldMessages) {
        putMessage(oldMessages[i].content, oldMessages[i].username, oldMessages[i].avatar, true);
    }
}

function formatMessage(typeToSend, textToSend) {
    var msg = {
        type: typeToSend,
        content: textToSend,
        username: userName,
        avatar: avatarImage
    };
    if (typeToSend == "text") oldMessages.push(msg);
    return JSON.stringify(msg);
}

function loginchat() {
    var chatZone = document.querySelector(".chatZone");
    chatZone.style.display = 'initial';

    var tempRoomName = document.querySelector("#roomNameInput").value
    if (tempRoomName) roomName = tempRoomName;
    var tempUserName = document.querySelector("#userNameInput").value;
    if (tempUserName) userName = tempUserName;

    server.connect("wss://ecv-etic.upf.edu/node/9000/ws", roomName + "MyServerWhats");

    if (roomName != "") createRoom();

    var loginZone = document.querySelector(".loginZone");
    loginZone.style.display = 'none';

    document.querySelector("#roomNameInput").value = "";
    document.querySelector("#userNameInput").value = "";
}


function createRoom() {
    roomNamePosition = document.querySelector(".contacts");

    var elem = document.createElement("div");
    elem.className = "specificContact";

    var pElem = document.createElement("p");
    pElem.className = "pContacts";
    pElem.innerText = roomName;

    imgElem = document.createElement("img");
    imgElem.src = "chat.png";

    var contactInfo = document.createElement("div");
    contactInfo.className = "contactInfo"

    contactInfo.appendChild(imgElem);
    contactInfo.appendChild(pElem);
    elem.appendChild(contactInfo)
    roomNamePosition.appendChild(elem);
}

function isWritting(contactName) {
    elem = document.querySelector(".specificContact");

    var writtingElement = document.createElement("p");
    writtingElement.className = "writting"
    writtingElement.innerText = contactName + " is writting...";

    elem.appendChild(writtingElement);
}

function deleteIsWritting() {
    elem = document.querySelector(".writting").remove();
    isSomeoneWriting = false;
}

function showJoinTheRoom(newUserName) {
    var elem = document.createElement("div");
    var message = document.createElement("div");
    var chat = document.querySelector("#allMsg");

    elem.innerText = newUserName + " has joined the room";
    elem.className = "joinTheRoomText"

    message.className = "joinTheRoom"
    message.appendChild(elem);
    chat.appendChild(message);

    document.querySelector(".chat").scrollTop = 10000000;
}

function changeAvatar(){
    var avatarImageVar = document.querySelector("#avatarImage");
    var avatarName = "avatars/avatar" + document.querySelector("#selectionAvatar").value + ".png";
    avatarImageVar.src = avatarName;
    avatarImage = avatarName;
}