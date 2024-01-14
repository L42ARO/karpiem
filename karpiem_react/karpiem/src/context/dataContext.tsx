/*Golang activity:
type Activity struct {
	ID          string	`gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Active		bool  	`gorm:"type:boolean;default:true"`
	Name        string
	Days        string
	DPoms       int64
	WPoms       int64
	DDone       int64
	WDone       int64
	LastUpdate  time.Time
	Focus       bool
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
export interface UpdateActivityResponse{
    updated_activity: Activity;
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