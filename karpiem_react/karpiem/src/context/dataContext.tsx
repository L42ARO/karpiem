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
interface Activity{
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