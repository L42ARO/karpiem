package models


type DayActivityResponse struct {
	ID   	string	`json:"id"`
	Name 	string	`json:"name"`
	DPoms	int64 	`json:"d_poms"`
	DDone	int64 	`json:"d_done"`
	Full 	bool  	`json:"full"`
	Focus 	bool  	`json:"focus"`
}

type DayAcitivitiesResponse struct {
	Dailies		[]DayActivityResponse	`json:"dailies"`
	Options		[]DayActivityResponse	`json:"options"`
	TotalPoms	int64					`json:"total_poms"`
	TotalDone	int64					`json:"total_done"`
}