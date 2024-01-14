import { InputChangeEventDetail, InputCustomEvent, IonBadge, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonChip, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonListHeader, IonModal, IonPage, IonRefresher, IonRefresherContent, IonRow, IonSegment, IonSegmentButton, IonTitle, IonToast, IonToggle, IonToolbar, ItemSlidingCustomEvent, RefresherEventDetail, SegmentChangeEventDetail, SegmentCustomEvent, useIonModal, useIonToast } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import './Tab1.css';
import '../theme/custom_global.css';
import { add, play, reload, remove, stop, timeOutline } from 'ionicons/icons';
import { FormEventHandler, useEffect, useRef, useState } from 'react';
import { useServer } from '../context/serverContext';
import { Activity, DeleteActivityResponse, GetAllActivitiesResponse, UpdateActivityRequest, UpdateActivityResponse } from '../context/dataContext';
import { Setting } from '../context/dataContext';
import { useLocation } from 'react-router';
import { ActivityItem, SimplifiedActivity } from '../components/ActivityItem';
import { OverlayEventDetail } from '@ionic/react/dist/types/components/react-component-lib/interfaces';
import { OverrideModal } from '../components/OverrideModal';
import { ActivityEditorModal, ActivityEditorModalProps } from '../components/ActivityEditorModal';

interface DayActivityResponse{
  id: string;
  name: string;
  d_poms: number;
  d_done: number;
  full: boolean;
  focus: boolean;
}

interface DayActivitiesResponse{
  habits: DayActivityResponse[];
  options: DayActivityResponse[];
  total_poms: number;
  total_done: number;
}


const Tab1: React.FC = () => {
  const {socket, connect, disconnect, serverURL, showToast} = useServer();
  // const [dayActivitiesResponse, setDayActivitiesResponse] = useState<DayActivitiesResponse>();
  const [habits, setHabits] = useState<SimplifiedActivity[]>([]);
  const [options, setOptions] = useState<SimplifiedActivity[]>([]);
  const [total_done, setTotalDone] = useState<number>(0);
  const [day_max, setDayMax] = useState<number>(7);
  const [displayed_day_max, setDisplayedDayMax] = useState<number>(7);
  const location = useLocation();
  const [day_blocked, setDayBlocked] = useState<boolean>(false);
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
    if(location.pathname === '/tab1'){
      console.log("Tab1 re-entered");
      getDayActivities();
      getSettings();
    }
  }, [location]);
  async function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    await getDayActivities();
    await getSettings();
    event.detail.complete();
  }
  const handleSocketMessage = (msg: MessageEvent) => {
    //If message includes : then it is a key:value pair, else just print the message
    if(msg.data.includes('::')){
      var data = msg.data.split('::');
      var key = data[0];
      var value = data[1];

      if (key === "SINGLE_UPDATE"){
        console.log("SINGLE_UPDATE:",value);
        //VAlue is a json string
        var activity_res = JSON.parse(value) as UpdateActivityResponse;
        //Go through the habits and options and update the ones that match the updated activity id
        if(activity_res){
          setHabits(prevState => {
            //Check for the activity in the habits and only update d_done
            const updatedhabits = prevState?.map(activity=>{
              const updated_activity = activity_res.updated_activity;
              if(activity.id === updated_activity.id){
                var full = updated_activity.d_done >= updated_activity.d_poms || updated_activity.w_done >= updated_activity.w_poms;
                return {
                  ...activity,
                  days: updated_activity.days,
                  name: updated_activity.name,
                  active: updated_activity.active,
                  d_done: updated_activity.d_done,
                  w_done: updated_activity.w_done,
                  d_poms: updated_activity.d_poms,
                  focus: updated_activity.focus,
                  full: full
                }
              }
              return activity;
            })
            return updatedhabits;
          })
          setOptions(prevState => {
            const updatedOptions = prevState?.map(activity=>{
              const updated_activity = activity_res.updated_activity;
              if(activity.id === activity_res.updated_activity.id){
                const full = updated_activity.d_done >= updated_activity.d_poms || updated_activity.w_done >= updated_activity.w_poms;
                return {
                  ...activity,
                  days: updated_activity.days,
                  name: updated_activity.name,
                  active: updated_activity.active,
                  d_done: updated_activity.d_done,
                  w_done: updated_activity.w_done,
                  d_poms: updated_activity.d_poms,
                  focus: updated_activity.focus,
                  full: full
                }
              }
              return activity;
            });
            // const updatedResponse = {...prevState, habits: updatedDailies, options: updatedOptions} as DayActivitiesResponse;
            return updatedOptions;
          });
        }

      }
      if (key === "SINGLE_NEW"){
        console.log("NEW:",value);
      }
      if(key === "SINGLE_DELETE"){
        console.log("DELETE:",value);
        const res = JSON.parse(value) as DeleteActivityResponse;
        //Go through the habits and options and delete the ones that match the deleted activity id
        if(res){
          setHabits(prevState => {
            const updatedHabits = prevState?.filter(activity => activity.id !== res.deleted_id);
            return updatedHabits;
          });
          setOptions(prevState => {
            const updatedOptions = prevState?.filter(activity => activity.id !== res.deleted_id);
            return updatedOptions;
          });
        }
      }
      if(key === "BATCH_RESET"){
        console.log("RESETING:",value);
      }

    }else{
      console.log(msg.data);
    }
  }
  useEffect(() => {
    getDayActivities();
    getSettings();
    connect(handleSocketMessage);
     
    return () => {
      disconnect();
    }
  }, []);
  async function getSettings(){
    try{
      const res = await fetch(serverURL + '/get_setting');
      if (!res.ok){
        var resTxt = await res.text();
        throw new Error(resTxt);
      }
      const data = await res.json() as Setting;
      //Parse the days_max from the settings
      const days_max = data.days_max;
      //Convert the days_max to a number array
      var days_max_array = [];
      for (var i = 0; i < days_max.length; i+=2){
        days_max_array.push(parseInt(days_max.substring(i, i+2), 16));
      }
      //Depending on the day of the week, set the day_max (Monday is 0, Sunday is 6)
      var day = new Date().getDay()-1;
      if(day < 0) day = 6;
      setDayMax(days_max_array[day]);
    }
    catch(err){
      console.log(err);
      showToast(`Error getting settings: ${(err as Error).message}`, "danger");
    }
  }
async function getDayActivities() {
  var today = new Date().getDay()-1;
  if(today < 0) today = 6;
  //Get the day as M, T, W, R, F, S, U
  var day = ['M', 'T', 'W', 'R', 'F', 'S', 'U'][today];

  try {
    const response = await fetch(serverURL + '/get_all_activities');
    if (!response.ok){
      var resTxt = await response.text();
      throw new Error(resTxt);
    }
    const data = await response.json() as GetAllActivitiesResponse;
      //Filter the activities to only include the ones that are active and have the day in their days
      data.activities = data.activities.filter(activity => activity.active && activity.days.indexOf(day) > -1);
      data.activities.sort((a, b) => {
        if (a.focus === b.focus) {
          const a_full = a.d_done >= a.d_poms || a.w_done >= a.w_poms;
          const b_full = b.d_done >= b.d_poms || b.w_done >= b.w_poms;
          if (a_full === b_full) {
            return 0; 
          } else {
            return a_full ? 1 : -1;
          }
        } else {
          return a.focus ? -1 : 1;
        }
      });
      //Separate the habits and weeklies
      //If d_poms * 7 == len(days) then it is a daily
      var habits = data.activities.filter(activity => activity.days.length == activity.d_poms*7);
      //Otherwise it is a weekly a.k.a optional for the day
      var options = data.activities.filter(activity => activity.days.length != activity.d_poms*7);
      //Convert the activities to a simplified version
      var habits_simplified = habits.map(activity => {
        var full = activity.d_done >= activity.d_poms || activity.w_done >= activity.w_poms;
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
        var full = activity.d_done >= activity.d_poms || activity.w_done >= activity.w_poms;
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
      setHabits(habits_simplified);
      setOptions(options_simplified);
      
    } catch (error) {
      console.log(error);
      // presentToastInfo((error as Error).message);
      showToast(`Error getting day activities: ${(error as Error).message}`, "danger");
    }
  }

  useEffect(() => {
    //Update the done count, go through the habits and weeklies and update the ones that match the updated activity id
    var newTotal = 0;
    habits.forEach(activity=>{
      newTotal += activity.d_done;
    });
    options.forEach(activity=>{
      newTotal += activity.d_done;
    });
    setTotalDone(newTotal);
  }, [habits, options]);
  useEffect(() => {
    setDisplayedDayMax(day_max);
  }, [day_max]);
  useEffect(() => {
    //If the total done is greater than the day max, block the day
    if(total_done >= day_max){
      setDayBlocked(true);
      setDisplayedDayMax(total_done);
    }
    else{
      setDayBlocked(false);
      setDisplayedDayMax(day_max);
    }
  }, [total_done]);
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
    <>
    <IonPage>
      <IonHeader id="header">
        <IonToolbar>
          <IonTitle>Day</IonTitle>
          <IonButton slot="end" color="primary" shape="round" onClick={e=>OpenActivityEditorModal()}>
            <IonIcon icon={add} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen={true} className='ion-padding-top'>
        {/* <ActivityEditorModal trigger='add-activity-trigger' newActivity={true} /> */}
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        <IonGrid fixed={true}>
          <IonRow className='ion-justify-content-center ion-padding-horizontal'>
            {Array.from({ length: displayed_day_max}, (_, i) => i).map((_, i) => {
              var mark_done = i < total_done;
              return <IonCol key={i} size="1.5" size-md="1" className='ion-no-padding'>
                <div className={`pom_circle ${mark_done?"complete":""}`}>
                <IonIcon icon={timeOutline} />
                </div>
              </IonCol>
            })}
          </IonRow>
        </IonGrid>
      <IonCard >
        <IonHeader>
          <IonToolbar className='gradient-header'>
            <IonTitle>Today</IonTitle>
          </IonToolbar>
        </IonHeader>
          <IonCardContent className='ion-no-padding'>
            <IonList>
              {habits.map((activity, i) => (
                <ActivityItem 
                  key={activity.id} 
                  activityData={activity} 
                  blocked={day_blocked} 
                  override_func={OpenOverrideModal}
                  edit_func={OpenActivityEditorModal}
                  daily
                />
              ))}
            </IonList>
          </IonCardContent>
        </IonCard>
        <IonCard>
          <IonHeader>
          <IonToolbar className='gradient-header'>
            <IonTitle>Options</IonTitle>
          </IonToolbar>
        </IonHeader>
          <IonCardContent className='ion-no-padding'>
        <IonList>
          {options.map((activity, i) => (
            <ActivityItem 
              key={activity.id}
              activityData={activity}
              blocked={day_blocked} 
              override_func={OpenOverrideModal}
              edit_func={OpenActivityEditorModal}
            />
          ))}
        </IonList>
</IonCardContent>
        </IonCard>
        
      </IonContent>
    </IonPage>
    </>
  );
};



export default Tab1;
