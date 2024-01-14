import { IonButton, IonCard, IonCardContent, IonChip, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonPage, IonRefresher, IonRefresherContent, IonRow, IonTitle, IonToolbar, RefresherEventDetail, useIonModal } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import './Tab2.css';
import '../theme/custom_global.css'
import { add, reload, remove, timeOutline } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { useServer } from '../context/serverContext';
import { useLocation } from 'react-router';
import { GetAllActivitiesResponse } from '../context/dataContext';
import { ActivityItem, SimplifiedActivity } from '../components/ActivityItem';
import { OverrideModal } from '../components/OverrideModal';
import { OverlayEventDetail } from '@ionic/react/dist/types/components/react-component-lib/interfaces';
import { ActivityEditorModal, ActivityEditorModalProps } from '../components/ActivityEditorModal';

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
  const {serverURL, showToast} = useServer();
  // const [weekActivitiesResponse, setWeekActivitiesResponse] = useState<WeekActivitiesResponse>();
  const [dailies, setDailies] = useState<SimplifiedActivity[]>([]);
  const [weeklies, setWeeklies] = useState<SimplifiedActivity[]>([]);
  const [total_poms, setTotalPoms] = useState<number>(0);
  const [total_done, setTotalDone] = useState<number>(0);
  const location = useLocation();
  const [overrideModalPresent, overrideModalDismiss] = useIonModal(OverrideModal, {
    onDismiss: (data:string, role:string)=>overrideModalDismiss(data, role)
  });
  const [currentEditorSettings, setCurrentEditorSettings] = useState<ActivityEditorModalProps>({
    onDismiss:()=>{},
    newActivity: true,
    daily: false
  });
  const [activityEditorModalPresent, activityEditorModalDismiss] = useIonModal(ActivityEditorModal, currentEditorSettings);

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
  async function getWeekActivities() {

  try {
    const response = await fetch(serverURL + '/get_all_activities');
    if (!response.ok){
      var resTxt = await response.text();
      throw new Error(resTxt);
    }
    const data = await response.json() as GetAllActivitiesResponse;
      //Filter the activities to only include the ones that are active and have the day in their days
      data.activities = data.activities.filter(activity => activity.active);
      data.activities.sort((a, b) => {
        if (a.focus === b.focus) {
          const a_full = a.w_done >= a.w_poms;
          const b_full = b.w_done >= b.w_poms;
          if (a_full === b_full) {
            return 0; 
          } else {
            return a_full ? 1 : -1;
          }
        } else {
          return a.focus ? -1 : 1;
        }
      });
      //Separate the activities into dailies and weeklies
      //If d_poms * 7 == len(days) then it is a daily
      var dailies = data.activities.filter(activity => activity.days.length == activity.d_poms*7);
      //Otherwise it is a weekly a.k.a optional for the day
      var options = data.activities.filter(activity => activity.days.length != activity.d_poms*7);
      //Convert the activities to a simplified version
      var dailies_simplified = dailies.map(activity => {
        var full = activity.w_done >= activity.w_poms;
        return {
          id: activity.id,
          name: activity.name,
          d_poms: activity.d_poms,
          w_poms: activity.w_poms,
          d_done: activity.d_done,
          w_done: activity.w_done,
          full: full,
          focus: activity.focus,
          days: activity.days,
          active: activity.active,
        }
      });
      var options_simplified = options.map(activity => {
        var full = activity.w_done >= activity.w_poms;
        return {
          id: activity.id,
          name: activity.name,
          d_poms: activity.d_poms,
          w_poms: activity.w_poms,
          d_done: activity.d_done,
          w_done: activity.w_done,
          full: full,
          focus: activity.focus,
          days: activity.days,
          active: activity.active,
        }
      });
      setDailies(dailies_simplified);
      setWeeklies(options_simplified);
      
    } catch (error) {
      console.log(error);
      // presentToastInfo((error as Error).message);
      showToast(`Error getting day activities: ${(error as Error).message}`, "danger");
    }
  }
  useEffect(() => {
    //Calculate the total poms and done
    var total_poms = 0;
    var total_done = 0;
    dailies.forEach(activity => {
      total_poms += activity.w_poms;
      total_done += activity.w_done;
    });
    weeklies.forEach(activity => {
      total_poms += activity.w_poms;
      total_done += activity.w_done;
    });
    console.log("updating total poms and done:")
    setTotalPoms(total_poms);
    setTotalDone(total_done);

  }, [dailies, weeklies]);
  const OpenOverrideModal = (n: number, changeDone: (poms_done: number, override_key?: string) => Promise<void>) => {
    overrideModalPresent({
      cssClass: 'translucent-modal',
      onWillDismiss: (ev: CustomEvent<OverlayEventDetail>) => {
        if (ev.detail.role === 'confirm') {
          const key = ev.detail.data as string;
          changeDone(n, key);
        }
      },
    });
  }
  const OpenActivityEditorModal = (activityData?: SimplifiedActivity, newActivity?:boolean, daily?:boolean) => {
    setCurrentEditorSettings({

      onDismiss: (data?: string | null | undefined | number, role?: string) => activityEditorModalDismiss(data, role),
      activityData: activityData,
      newActivity: newActivity ?? true,
      daily: daily ?? false
    });
    activityEditorModalPresent({
      cssClass: 'translucent-modal',
      onWillDismiss: (ev: CustomEvent<OverlayEventDetail>) => {
        if (ev.detail.role === 'confirm') {
          console.log("Confirm");
        }
      },
    });
  }
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Week</IonTitle>
          <IonButton color="primary" slot='end' shape="round" onClick={e=>OpenActivityEditorModal()}>
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
              {dailies.map((activity, i) => (
                <ActivityItem key={activity.id} activityData={activity} week_view override_func={OpenOverrideModal} edit_func={OpenActivityEditorModal}/>
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
          {weeklies.map((activity, i) => (
            <ActivityItem key={activity.id} activityData={activity} week_view override_func={OpenOverrideModal} edit_func={OpenActivityEditorModal}/>
          ))}
        </IonList>
</IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

// interface ActivityProps {
//   activityData: WeekActivityResponse;
//   onClick?: (activity: WeekActivityResponse)=>void;
// }

// const Activity:React.FC<ActivityProps>= ({activityData, onClick}:ActivityProps) => {
//   return <IonItemSliding onClick={e=>{
//     e.preventDefault();
//     if (onClick) onClick(activityData);
//   }}>
//         <IonItemOptions side="start">
//           <IonItemOption color="success">
//             <IonIcon icon={add}/>
//           </IonItemOption>
//         </IonItemOptions>

//          <IonItem id="update-modal-trigger">
//           <IonLabel slot='start'>{activityData.name}</IonLabel>
//           <IonChip slot='end' color='primary'>{activityData.w_done} / {activityData.w_poms}</IonChip>
//         </IonItem>

//         <IonItemOptions side="end">
//           <IonItemOption color="danger">
//             <IonIcon icon={remove}/>
//           </IonItemOption>
//         </IonItemOptions>
//       </IonItemSliding>
// }

export default Tab2;
