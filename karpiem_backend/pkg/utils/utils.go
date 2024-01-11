package utils

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
)

var Production bool = false

func init() {
	if v := GetEnvVar("GIN_MODE"); v == "release" {
		Production = true
	}
}

func GetEnvVar(varName string) string {
	err := godotenv.Load()
	if err != nil {
		Debugf("No .env file found")
	}
	envVar, exists := os.LookupEnv(varName)
	if !exists {
		Debugf("Env variable %s not found \n", varName)
		return ""
	}
	if !Production {
		Debugf("ENV Var: %s = %s\n", varName, envVar)
	}
	return envVar

}
func Debugf(s string, args ...interface{}) {
	if Production {
		log.Printf(s, args...)
	} else {
		fmt.Printf(s, args...)
	}
}

func GetPort() string {
	var port = os.Getenv("PORT")
	if port == "" {
		port = "8080"
		fmt.Println("Defaulting to port " + port)
	}
	return ":" + port
}