package shared

import (
	webpush "github.com/SherClockHolmes/webpush-go"
)

var Push_subscriptions map[string][]*webpush.Subscription

func init() {
	Push_subscriptions = make(map[string][]*webpush.Subscription)
}
