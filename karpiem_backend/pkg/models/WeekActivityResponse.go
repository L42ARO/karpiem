package models


type WeekActivityResponse struct {
	ID   	string	`json:"id"`
	Name 	string	`json:"name"`
	WPoms	int64 	`json:"w_poms"`
	WDone	int64 	`json:"w_done"`
	Full	bool	`json:"full"`
}

type WeekAcitivitiesResponse struct {
	Dailies		[]WeekActivityResponse	`json:"dailies"`
	Weeklies	[]WeekActivityResponse	`json:"weeklies"`
	TotalPoms	int64					`json:"total_poms"`
	TotalDone	int64					`json:"total_done"`
}