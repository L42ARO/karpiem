package models

type UpdateActivityRequest struct {
	ID		string `json:"id"`
	Active 	bool   `json:"active"`
	Daily	bool   `json:"daily"`
	Name	string `json:"name"`
	Days 	string `json:"days"`
	Poms	int64  `json:"poms"`
	Max		int64  `json:"max"`
}