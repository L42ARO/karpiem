package data

type Setting struct {
	ID		string	`gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	DaysMax string `json:"days_max"`
	WeekMax int64 `json:"week_max"`
	UserID string `gorm:"type:uuid" json:"user_id"`
	User User `gorm:"foreignKey:UserID" json:"user"`
}