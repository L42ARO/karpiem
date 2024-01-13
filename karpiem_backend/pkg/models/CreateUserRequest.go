package models

type CreateUserRequest struct {
	Username string `json:"username"`
	Email string `json:"email"`
	Password string `json:"password"`
}