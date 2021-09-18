Name: Martí Coma	NIA: 206279	User: U150307

Who the web works:
·Login: When a new users enters the web there are a login screen, in this screenn the user can specify their name, the room to join and the avatar to use
	All this variables are stored in the program and used when needed, for the avater it is stored the complet path
	If the user didn't put the information of the name, room, and avatar a default values are set
	The avatar selected is also visible in that part

·Chat: In the chat zone there are two parts, in the left side there is the name of the room the user is
	When someone is typing it apperars a message i that zone
	
	-Between the part explained before there is the part of the chat, where the users can send and recive messages.
	-In the bottom part there is a zone to writte the messages and to send it, and in the top part it appears the messages
	-The messages are send using the protocol defined in class, i have added a type of messages called new user that is used
	when a new user joind the room, it sends the name, and the other people in the rom show a message indicating that the new user join the room
	-For sending the log of the old messages all the users in the web have the previous messages stored in an array and when a new
	user join the room the older user send the array of old messages to the new user.
	-To send normal messages apart of the information of the protocol defined in class i also send the avatar path of the user.
	The avatar of all the users is shown in the messages, but the user name of the self user is not show, this is done following the whatsapp model
	-To shown when a user is writting when someone press a key (keydown) it is send a messages to all the other users with the type "typing"
	When a user recive this kind of message it shows a text and set a timeout to remove it after 2000ms
	-As explained the messages have different format if are the self messages or the recived messages,
	they have different class so their apparence is different.