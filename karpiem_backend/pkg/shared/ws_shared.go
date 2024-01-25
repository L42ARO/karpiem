package shared

import (
	"github.com/gorilla/websocket"
)

var WS_Rooms map[string][]*websocket.Conn

func init() {
	WS_Rooms = make(map[string][]*websocket.Conn)
}
