package data

import (
	"time"
)

type Activity struct {
	ID          string	`gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Active		bool  	`gorm:"type:boolean;default:true"`
	Name        string
	Days        string
	DPoms       int64
	WPoms       int64
	DDone       int64
	WDone       int64
	LastUpdate  time.Time
}

