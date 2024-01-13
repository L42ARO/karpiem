package controllers

import(
	"log"
	"github.com/gorilla/websocket"
	"net/http"
)



func handleMessage(msg []byte, conn *websocket.Conn) {
	//Print the length of the message
	if len(string(msg)) > 7 && string(msg[:7]) == "CONNECT" { HandleConnectMessage(msg, conn) }
	return
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}
func websocketHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	defer conn.Close()

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Println(err)
			return
		}

		// Handle the received message
		handleMessage(msg, conn)
	}
}