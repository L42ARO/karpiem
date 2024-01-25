package controllers

import (
	"karpiem/pkg/shared"
	"log"

	"github.com/gorilla/websocket"
)

//var shared.WS_Rooms map[string][]*websocket.Conn
//
//func init(){
//	shared.WS_Rooms = make(map[string][]*websocket.Conn)
//}

//Message types:
// CONNECT:USER_ID => Ex: CONNECT:123456789

func HandleConnectMessage(msg []byte, conn *websocket.Conn) {
	//Separate the strings by :
	//msg[0] = CONNECT
	//msg[1] = USER_ID
	user_id := string(msg[8:])
	//Check if the room exists
	if shared.WS_Rooms[user_id] == nil {
		shared.WS_Rooms[user_id] = []*websocket.Conn{}
	} else {
		//Add the connection to the room
		shared.WS_Rooms[user_id] = append(shared.WS_Rooms[user_id], conn)
	}
	log.Println("Connected to room: " + user_id)
	conn.WriteMessage(1, []byte("CONNECTED:"+user_id))
}
