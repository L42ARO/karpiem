package models
import (
	webpush "github.com/SherClockHolmes/webpush-go"
)

type SaveSubscriptionRequest struct {
	Subscription webpush.Subscription `json:"subscription"`
}