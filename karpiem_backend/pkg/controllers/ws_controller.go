package controllers

import(
	"log"
	"github.com/gorilla/websocket"
)

var WS_Rooms map[string][]*websocket.Conn

func init(){
	WS_Rooms = make(map[string][]*websocket.Conn)
}

//Message types:
// CONNECT:USER_ID => Ex: CONNECT:123456789

func HandleConnectMessage(msg []byte, conn *websocket.Conn){
	//Separate the strings by :
	//msg[0] = CONNECT
	//msg[1] = USER_ID
	user_id := string(msg[8:])
	//Check if the room exists
	if WS_Rooms[user_id] == nil {
		WS_Rooms[user_id] = []*websocket.Conn{}
	}else{
		//Add the connection to the room
		WS_Rooms[user_id] = append(WS_Rooms[user_id], conn)
	}
	log.Println("Connected to room: " + user_id)
	conn.WriteMessage(1, []byte("CONNECTED:" + user_id))
}