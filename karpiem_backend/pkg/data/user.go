package data
type User struct {
ID string `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
Username string `json:"username"`
Email string `json:"email"`
}