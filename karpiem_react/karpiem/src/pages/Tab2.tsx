import { IonButton, IonCard, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonItem, IonLabel, IonPage, IonRefresher, IonRefresherContent, IonRow, IonTitle, IonToolbar, RefresherEventDetail } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import './Tab2.css';
import { add, reload, timeOutline } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { useServer } from '../context/serverContext';

interface WeekActivityResponse{
  id: string;
  name: string;
  w_poms: number;
  w_done: number;
  full: boolean;
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
  
  useEffect(() => {
    //Figure out what day it is
    const present = new Date();
    const day = present.getDay();
    setToday(day == 0 ? 'U' : day == 1 ? 'M' : day == 2 ? 'T' : day == 3 ? 'W' : day == 4 ? 'R' : day == 5 ? 'F' : 'S');
    getWeekActivities();
  }, []);
  function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    setTimeout(() => {
      //Use await to get week activities
      getWeekActivities();
      event.detail.complete();
    }, 1000);
  }
  //Make async function to get week activities
  async function getWeekActivities(){
    const res = await fetch(serverURL + '/week_activities');
    const data: WeekActivitiesResponse = await res.json();
    console.log(data);
    setWeekActivitiesResponse(data);
    setTotalPoms(data.total_poms);
    setTotalDone(data.total_done);
    return data;
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
      </IonContent>
    </IonPage>
  );
};

export default Tab2;
