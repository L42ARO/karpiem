package controllers

import (
	"net/http"
)

func SetupHandlers() {
	http.HandleFunc("/add_activity", AddActivityHandler)
	http.HandleFunc("/day_activities", GetDayActivitiesHandler)
	http.HandleFunc("/week_activities", GetWeekActivitiesHandler)
	http.HandleFunc("/reset_day", ResetDayHandler)
	http.HandleFunc("/focus_activity", FocusRequestHandler)
	http.HandleFunc("/reset_week", ResetWeekHandler)
	http.HandleFunc("/change_done", ChangeDoneHandler)
	http.HandleFunc("/delete_activity", DeleteActivityHandler)
	http.HandleFunc("/update_activity", UpdateActivityHandler)
	http.HandleFunc("/admin", AdminViewHandler)
}