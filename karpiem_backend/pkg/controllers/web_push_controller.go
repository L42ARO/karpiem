package controllers

import (
	"encoding/json"
	"karpiem/pkg/models"
	"karpiem/pkg/services"
	"karpiem/pkg/shared"
	"log"
	"net/http"

	webpush "github.com/SherClockHolmes/webpush-go"
)

//var Push_subscriptions map[string][]*webpush.Subscription
//
//func init() {
//	Push_subscriptions = make(map[string][]*webpush.Subscription)
//}

func SaveSubscriptionHandler(w http.ResponseWriter, r *http.Request) {
	//Get request
	var request models.SaveSubscriptionRequest
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		msg := "Error decoding request body"
		log.Println(msg)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}
	defer r.Body.Close()
	log.Println("Got request to save subscription")
	subscription := request.Subscription
	//Add request to  Push_subscriptions with id "123456789" for now
	if shared.Push_subscriptions["123456789"] == nil {
		shared.Push_subscriptions["123456789"] = []*webpush.Subscription{}
	}
	shared.Push_subscriptions["123456789"] = append(shared.Push_subscriptions["123456789"], &subscription)
	log.Println("Added subscription to Push_subscriptions")
	//Send response as OK
	w.WriteHeader(http.StatusOK)
}
func SendNotificationHandler(w http.ResponseWriter, r *http.Request) {
	//vapidPublicKey := utils.GetEnvVar("VAPID_PUBLIC_KEY")
	//vapidPrivateKey := utils.GetEnvVar("VAPID_PRIVATE_KEY")
	////For each subscription in shared.Push_subscriptions["123456789"], send a notification
	//for _, sub := range shared.Push_subscriptions["123456789"] {
	//	resp, err := webpush.SendNotification([]byte("Hello There!"), sub, &webpush.Options{
	//		Subscriber:      "mailto:lazaro.aj.80s@gmail.com",
	//		VAPIDPublicKey:  vapidPublicKey,
	//		VAPIDPrivateKey: vapidPrivateKey,
	//		TTL:             30,
	//	})
	//	if err != nil {
	//		msg := "Error sending notification"
	//		log.Println(msg)
	//		http.Error(w, msg, http.StatusInternalServerError)
	//		return
	//	}
	//	defer resp.Body.Close()
	//}
	if err := services.WebPush("Test Message"); err != nil {
		msg := "Error sending notification"
		log.Println(msg)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)

}
