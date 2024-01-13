package controllers

import (
	"net/http"
)

func SetupHandlers() {
	http.HandleFunc("/add_activity", AddActivityHandler)
	http.HandleFunc("/day_activities", GetDayActivitiesHandler)
	http.HandleFunc("/week_activities", GetWeekActivitiesHandler)
	http.HandleFunc("/focus_activity", FocusRequestHandler)
	http.HandleFunc("/change_done", ChangeDoneHandler)
	http.HandleFunc("/delete_activity", DeleteActivityHandler)
	http.HandleFunc("/update_activity", UpdateActivityHandler)
	http.HandleFunc("/admin", AdminViewHandler)
	http.HandleFunc("/reset_day", ResetDayHandler)
	http.HandleFunc("/reset_week", ResetWeekHandler)

	http.HandleFunc("/change_setting", ChangeSettingHandler)
	http.HandleFunc("/get_setting", GetSettingHandler)
	http.HandleFunc("/create_setting", CreateSettingHandler)

	http.HandleFunc("/create_user", CreateUserHandler)
	http.HandleFunc("/login_user", LoginHandler)

	http.HandleFunc("/ws", websocketHandler)
}