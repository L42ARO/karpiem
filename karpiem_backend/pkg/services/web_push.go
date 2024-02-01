package services

import (
	"karpiem/pkg/shared"
	"karpiem/pkg/utils"
	"log"

	webpush "github.com/SherClockHolmes/webpush-go"
)

func WebPush(push_msg string) error {
	vapidPublicKey := utils.GetEnvVar("VAPID_PUBLIC_KEY")
	vapidPrivateKey := utils.GetEnvVar("VAPID_PRIVATE_KEY")
	//For each subscription in shared.Push_subscriptions["123456789"], send a notification
	for _, sub := range shared.Push_subscriptions["123456789"] {
		resp, err := webpush.SendNotification([]byte(push_msg), sub, &webpush.Options{
			Subscriber:      "mailto:lazaro.aj.80s@gmail.com",
			VAPIDPublicKey:  vapidPublicKey,
			VAPIDPrivateKey: vapidPrivateKey,
			TTL:             30,
		})
		if err != nil {
			msg := "Error sending notification"
			log.Println(msg)
			//Return error
			return err
		}
		defer resp.Body.Close()
	}
	//Return erro == nil
	return nil
}
