package data

import (
	"log"
	"karpiem/pkg/utils"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var (
	db *gorm.DB
)

func InitDB(migrate bool) {
	connString := utils.GetEnvVar("DATABASE_URL")
	conn, err := gorm.Open(postgres.Open(connString), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}
	log.Println("Connected to database")
	log.Println("Migrate: ", migrate)
	if migrate {
		if err := conn.AutoMigrate(&Activity{}); err != nil {
			log.Fatal(err)
		}
	}
	db = conn
}

func GetDB() *gorm.DB {
	return db
}
