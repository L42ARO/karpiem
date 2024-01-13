package controllers

import (
	"net/http"
	"log"
	"encoding/json"
	"karpiem/pkg/data"
	"karpiem/pkg/models"
	"golang.org/x/crypto/bcrypt"
)


// Create user using models.CreateUserRequest
func CreateUserHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("New user handler")
	decoder := json.NewDecoder(r.Body)
	var t models.CreateUserRequest
	err := decoder.Decode(&t)
	if err != nil {
		panic(err)
	}
	defer r.Body.Close()
	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(t.Password), bcrypt.DefaultCost)
	if err != nil {
		msg := "Error hashing password:"+err.Error()
		log.Println(msg)
		http.Error(w, msg, http.StatusInternalServerError)
	}
	// Create the user
	user := data.User{
		Username: t.Username,
		Email: t.Email,
		Password: string(hashedPassword),
	}
	// Save the user
	if err := data.GetDB().Create(&user).Error; err != nil {
		log.Println("Error creating user:"+err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	//Create a setting for the user
	setting := data.Setting{
		UserID: user.ID,
		DaysMax: "0C0C0C0C0C0C0C",
		WeekMax: 86,
	}
	if err := data.GetDB().Create(&setting).Error; err != nil {
		msg:="Error creating setting:"+err.Error()
		log.Println(msg)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}


	//Return just the user id
	res := models.UserResponse{
		ID: user.ID,
		Email: user.Email,
		Username: user.Username,
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(res)
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("Login handler")
	//User LoginUserRequest to get the username and password
	decoder := json.NewDecoder(r.Body)
	var request models.LoginUserRequest
	err := decoder.Decode(&request)
	if err != nil {
		panic(err)
	}
	defer r.Body.Close()
	//Get the user from the database
	db := data.GetDB()
	var user data.User
	db.Where("username = ?", request.Username).First(&user)
	//Check if the password is correct
	//Hash the password again
	doubleHashedPassword, err := bcrypt.GenerateFromPassword([]byte(request.Password), bcrypt.DefaultCost)
	err = bcrypt.CompareHashAndPassword([]byte(doubleHashedPassword), []byte(request.Password))
	if err != nil {
		msg := "Error comparing password:"+err.Error()
		log.Println(msg)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}
	//Return just the user id
	res := models.UserResponse{
		ID: user.ID,
		Email: user.Email,
		Username: user.Username,
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(res)

}
