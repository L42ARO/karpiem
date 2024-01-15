package main
import (
	"fmt"
	webpush "github.com/SherClockHolmes/webpush-go"
)

func main(){
	privateKey, publicKey, err := webpush.GenerateVAPIDKeys()
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println("Private key: " + privateKey)
	fmt.Println("Public key: " + publicKey)
}