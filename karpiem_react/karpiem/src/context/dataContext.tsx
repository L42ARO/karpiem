/*Golang activity:
type Activity struct {
	ID         string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Active     bool      `gorm:"type:boolean;default:true" json:"active"`
	Name       string    `json:"name"`
	Days       string    `json:"days"`
	DPoms      int64     `json:"d_poms"`
	WPoms      int64     `json:"w_poms"`
	DDone      int64     `json:"d_done"`
	WDone      int64     `json:"w_done"`
	LastUpdate time.Time `json:"last_update"`
	Focus      bool      `json:"focus"`
	Focus_time int64 	`json:"focus_time"`
}
*/
export interface Activity{
    id: string;
    active: boolean;
    name: string;
    days: string;
    d_poms: number;
    w_poms: number;
    d_done: number;
    w_done: number;
    last_update: string;
    focus: boolean;
    focus_time: number;
}
export interface Setting{
    id: string;
    days_max: string;
    week_max: number;
    user_id: string;
    user: User;
}
interface User{
    id: string;
    username: string;
    email: string;
}
/*Golang UpdateActivityResponse:
type UpdateActivityResponse struct {
	Updated_Activity data.Activity	`json:"updated_activity"`
	TriggerStart bool `json:"trigger_start"`
	TriggerStop bool `json:"trigger_stop"`
}*/
export interface UpdateActivityResponse{
    updated_activity: Activity;
    trigger_start: boolean;
    trigger_stop: boolean;
}
/*Golang UpdateFocusRequest:
type FocusRequest struct {
	ID          string `json:"id"`
	Focus       bool   `json:"focus"`
	FocusTime  	int64  `json:"focus_time"`
	RoomID		string `json:"room_id"`
}*/
export interface UpdateFocusRequest{
    id: string;
    focus: boolean;
    focus_time: number;
    room_id: string;
}

export interface GetAllActivitiesResponse{
    activities: Activity[];
}
// UpdateActivityRequest golang:
/*type UpdateActivityRequest struct {
	ID		string `json:"id"`
	Active 	bool   `json:"active"`
	Daily	bool   `json:"daily"`
	Name	string `json:"name"`
	Days 	string `json:"days"`
	Poms	int64  `json:"poms"`
	Max		int64  `json:"max"`
	RoomID	string `json:"room_id"`
}
*/
export interface UpdateActivityRequest{
    id: string;
    active: boolean;
    daily: boolean;
    name: string;
    days: string;
    poms: number;
    max: number;
    room_id: string;
}


// DeleteActivityRequest golang:
/* type DeleteActivityRequest struct {
	ID string `json:"id"`
	RoomID string `json:"room_id"`
}*/
export interface DeleteActivityRequest{
    id: string;
    room_id: string;
}
// DeleteActivityResponse golang:
/* type DeleteActivityResponse struct {
	Deleted_ID string `json:"deleted_id"`
    Deleted_Name string `json:"deleted_name"`
}*/
export interface DeleteActivityResponse{
    deleted_id: string;
    deleted_name: string;
}