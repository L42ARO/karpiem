package models
//Same as data.User but without password
type UserResponse struct {
	ID string `json:"id"`
	Email string `json:"email"`
	Username string `json:"username"`
}