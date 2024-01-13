import { IonButton, IonCard, IonCardContent, IonChip, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonPage, IonRefresher, IonRefresherContent, IonRow, IonTitle, IonToolbar, RefresherEventDetail } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import './Tab2.css';
import '../theme/custom_global.css'
import { add, reload, remove, timeOutline } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { useServer } from '../context/serverContext';
import { useLocation } from 'react-router';

interface WeekActivityResponse{
  id: string;
  name: string;
  w_poms: number;
  w_done: number;
  full: boolean;
  focus: boolean;
}
interface WeekActivitiesResponse{
  dailies: WeekActivityResponse[];
  weeklies: WeekActivityResponse[];
  total_poms: number;
  total_done: number;
}
const Tab2: React.FC = () => {
  const [today, setToday] = useState<'M' | 'T' | 'W' | 'R' | 'F' | 'S' | 'U'>('M');
  const {serverURL} = useServer();
  const [weekActivitiesResponse, setWeekActivitiesResponse] = useState<WeekActivitiesResponse>();
  const [total_poms, setTotalPoms] = useState<number>(0);
  const [total_done, setTotalDone] = useState<number>(0);
  const location = useLocation();

  useEffect(() => {
    //Check if it's current location programmatically
    if(location.pathname === '/tab2'){
      getWeekActivities();
    }
  }, [location]);
  
  useEffect(() => {
    //Figure out what day it is
    const present = new Date();
    const day = present.getDay();
    setToday(day == 0 ? 'U' : day == 1 ? 'M' : day == 2 ? 'T' : day == 3 ? 'W' : day == 4 ? 'R' : day == 5 ? 'F' : 'S');
    getWeekActivities();
  }, []);
  async function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    await getWeekActivities();
    event.detail.complete();
  }
  //Make async function to get week activities
  async function getWeekActivities(){
    try{
    const res = await fetch(serverURL + '/week_activities');
    const data: WeekActivitiesResponse = await res.json();
    data.dailies.sort((a, b) => {
        if (a.focus === b.focus) {
          if (a.full === b.full) {
            return 0; 
          } else {
            return a.full ? 1 : -1;
          }
        } else {
          return a.focus ? -1 : 1;
        }
      });
      data.weeklies.sort((a, b) => {
        if (a.focus === b.focus) {
          if (a.full === b.full) {
            return 0; 
          } else {
            return a.full ? 1 : -1;
          }
        } else {
          return a.focus ? -1 : 1;
        }
      });
    console.log(data);
    setWeekActivitiesResponse(data);
    setTotalPoms(data.total_poms);
    setTotalDone(data.total_done);
    return data;
    }
    catch(err){
      console.log(err);
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButton slot="start" color="primary">
            <IonIcon icon={reload} />
          </IonButton>
          <IonTitle>Week</IonTitle>
          <IonButton slot="end" color="primary" id="add-activity-trigger">
            <IonIcon icon={add} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen={true} className='ion-padding-top'>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        <IonGrid fixed={true}>
          <IonRow className='ion-justify-content-center ion-padding-horizontal'>
            {['M', 'T', 'W', 'R', 'F', 'S', 'U'].map((day, i) => {
              return <IonCol key={i} size="1.5" size-md="1" className='ion-no-padding'>
                <div className={`day_circle ${day===today?"today":''}`}>
                  {day}
                </div>
              </IonCol>
            })}
          </IonRow>
          <IonRow className='ion-justify-content-center ion-padding-horizontal'>
            <IonCol size='auto'>
              <IonTitle size='large'> <b>{total_done} / {total_poms}</b> </IonTitle>
            </IonCol>
          </IonRow>
        </IonGrid>
        <IonCard >
        <IonHeader>
          <IonToolbar className='gradient-header'>
            <IonTitle>Dailies</IonTitle>
          </IonToolbar>
        </IonHeader>
          <IonCardContent className='ion-no-padding'>
            <IonList>
              {weekActivitiesResponse?.dailies.map((activity, i) => (
                <Activity key={activity.id} activityData={activity}/>
              ))}
            </IonList>
          </IonCardContent>
        </IonCard>
        <IonCard>
          <IonHeader>
          <IonToolbar className='gradient-header'>
            <IonTitle>Weeklies</IonTitle>
          </IonToolbar>
        </IonHeader>
          <IonCardContent className='ion-no-padding'>
        <IonList>
          {weekActivitiesResponse?.weeklies.map((activity, i) => (
            <Activity key={activity.id} activityData={activity}/>
          ))}
        </IonList>
</IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

interface ActivityProps {
  activityData: WeekActivityResponse;
  onClick?: (activity: WeekActivityResponse)=>void;
}

const Activity:React.FC<ActivityProps>= ({activityData, onClick}:ActivityProps) => {
  return <IonItemSliding onClick={e=>{
    e.preventDefault();
    if (onClick) onClick(activityData);
  }}>
        <IonItemOptions side="start">
          <IonItemOption color="success">
            <IonIcon icon={add}/>
          </IonItemOption>
        </IonItemOptions>

         <IonItem id="update-modal-trigger">
          <IonLabel slot='start'>{activityData.name}</IonLabel>
          <IonChip slot='end' color='primary'>{activityData.w_done} / {activityData.w_poms}</IonChip>
        </IonItem>

        <IonItemOptions side="end">
          <IonItemOption color="danger">
            <IonIcon icon={remove}/>
          </IonItemOption>
        </IonItemOptions>
      </IonItemSliding>
}

export default Tab2;
