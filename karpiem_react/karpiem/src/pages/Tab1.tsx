import { InputChangeEventDetail, InputCustomEvent, IonBadge, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonChip, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonListHeader, IonModal, IonPage, IonRefresher, IonRefresherContent, IonRow, IonSegment, IonSegmentButton, IonTitle, IonToolbar, ItemSlidingCustomEvent, RefresherEventDetail, SegmentChangeEventDetail, SegmentCustomEvent } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import './Tab1.css';
import { add, play, reload, remove, stop, timeOutline } from 'ionicons/icons';
import { FormEventHandler, useEffect, useRef, useState } from 'react';
import { useServer } from '../context/serverContext';
import { UpdateActivityResponse } from '../context/dataContext';

interface DayActivityResponse{
  id: string;
  name: string;
  d_poms: number;
  d_done: number;
  full: boolean;
  focus: boolean;
}
interface DayActivitiesResponse{
  dailies: DayActivityResponse[];
  options: DayActivityResponse[];
  total_poms: number;
  total_done: number;
}

const Tab1: React.FC = () => {
  const {socket, connect, disconnect, serverURL} = useServer();
  const [dayActivitiesResponse, setDayActivitiesResponse] = useState<DayActivitiesResponse>();
  const [total_done, setTotalDone] = useState<number>(0);

  async function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    await getDayActivities();
    event.detail.complete();
  }
  const handleSocketMessage = (msg: MessageEvent) => {
    //If message includes : then it is a key:value pair, else just print the message
    if(msg.data.includes('::')){
      var data = msg.data.split('::');
      var key = data[0];
      var value = data[1];

      if (key === "SINGLE_UPDATE"){
        //VAlue is a json string
        var activity_res = JSON.parse(value) as UpdateActivityResponse;
        //Go through the dailies and weeklies and update the ones that match the updated activity id
        if(activity_res)
          setDayActivitiesResponse(prevState => {
            //Check for the activity in the dailies and only update d_done
            const updatedDailies = prevState?.dailies.map(activity=>{
              const updated_activity = activity_res.updated_activity;
              if(activity.id === updated_activity.id){
                var full = updated_activity.d_done >= updated_activity.d_poms || updated_activity.w_done >= updated_activity.w_poms;
                return {
                  ...activity,
                  d_done: updated_activity.d_done,
                  focus: updated_activity.focus,
                  full: full
                }
              }
              return activity;
            })
            const updatedOptions = prevState?.options.map(activity=>{
              const updated_activity = activity_res.updated_activity;
              if(activity.id === activity_res.updated_activity.id){
                const full = updated_activity.d_done >= updated_activity.d_poms || updated_activity.w_done >= updated_activity.w_poms;
                return {
                  ...activity,
                  d_done: updated_activity.d_done,
                  focus: updated_activity.focus,
                  full: full
                }
              }
              return activity;
            });
            const updatedResponse = {...prevState, dailies: updatedDailies, options: updatedOptions} as DayActivitiesResponse;
            return updatedResponse;
          });

      }

    }else{
      console.log(msg.data);
    }
  }
  useEffect(() => {
    getDayActivities();

    connect(handleSocketMessage);
     
    return () => {
      disconnect();
    }
  }, []);
async function getDayActivities() {
  try {
    const response = await fetch(serverURL + '/day_activities');
    const data = await response.json() as DayActivitiesResponse;
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
      data.options.sort((a, b) => {
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
      setDayActivitiesResponse(data);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    //Update the done count, go through the dailies and weeklies and update the ones that match the updated activity id
    var newTotal = 0;
    dayActivitiesResponse?.dailies.forEach(activity=>{
      newTotal += activity.d_done;
    });
    dayActivitiesResponse?.options.forEach(activity=>{
      newTotal += activity.d_done;
    });
    setTotalDone(newTotal);
  }, [dayActivitiesResponse]);

  function EditActivity(activity: DayActivityResponse){
    console.log(activity);
  }
  
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButton slot="start" color="primary">
            <IonIcon icon={reload} />
          </IonButton>
          <IonTitle>Day</IonTitle>
          <IonButton slot="end" color="primary" id="add-activity-trigger">
            <IonIcon icon={add} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen={true} className='ion-padding-top'>
        <ActivityEditorModal trigger='add-activity-trigger' newActivity={true} />
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        <IonGrid fixed={true}>
          <IonRow className='ion-justify-content-center ion-padding-horizontal'>
            {Array.from({ length: 12}, (_, i) => i).map((_, i) => {
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
              {dayActivitiesResponse?.dailies.map((activity, i) => (
                <Activity key={activity.id} activityData={activity}/>
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
          {dayActivitiesResponse?.options.map((activity, i) => (
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
  activityData: DayActivityResponse;
  onClick?: (activity: DayActivityResponse)=>void;
}

const Activity:React.FC<ActivityProps>= ({activityData, onClick}:ActivityProps) => {
  const [poms_done, setPomsDone] = useState<number>(activityData.d_done);
  const [last_slide, setLastSlide] = useState<number>(0);
  const {serverURL} = useServer();
  const slider = useRef<HTMLIonItemSlidingElement>(null);
  async function ChangeDoneCount(e: ItemSlidingCustomEvent){
    var value = await e.target.getSlidingRatio();
    //If value == 1, then the user is subtracting from the count
    //If value == -1, then the user is adding to the count
    //if(value > 1){
    //  if (poms_done > 0){
    //    setPomsDone(poms_done - 1);
    //  }
    //  e.target.close();
    //}
    //else if (value < -3){
    //  if (poms_done < activityData.d_poms)
    //    setPomsDone(poms_done + 1);
    //  e.target.close();
    //}
  }
  function ModifyDoneCount(n: number){
    if ((n<0 && poms_done> 0) || (n>0 && !activityData.full)){
      setPomsDone(poms_done + n);
    }
    slider.current?.close();
  }
  async function FocusActivity(){
    var focus = !activityData.focus;
    var res = await fetch(serverURL + '/focus_activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: activityData.id,
        focus: focus,
        room_id:"123456789"
      })
    })
    if (res.ok){
      const data: DayActivityResponse = await res.json();
      console.log(data);
    }
    else if(res.status == 400){ //Bad request
      //Try to get the json data
      try{
        const data = await res.json();
        console.log(data);
      }
      catch(error){
        console.log(error);
      }
    }
    slider.current?.close();
  }

  useEffect(() => {
    if(poms_done != activityData.d_done){
      //Send updated done count to server
      fetch(serverURL + '/change_done', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          d_or_w: true,
          id: activityData.id,
          value: poms_done,
          override_key: "",
          room_id:"123456789"
        })
      })
    }
  }, [poms_done]);
  return <IonItemSliding 
  ref={slider}
  onClick={e=>{
    e.preventDefault();
    if (onClick) onClick(activityData);
  }}>
        <IonItemOptions side="start" onIonSwipe={e=>ModifyDoneCount(1)}>
          <IonItemOption color="success" expandable onClick={e=>ModifyDoneCount(1)}>
            <IonIcon icon={add}/>
          </IonItemOption>
          <IonItemOption color="primary"  onClick={e=>FocusActivity()}>
            <IonIcon slot="top" icon={`${activityData.focus?stop:play}`}/>
            {activityData.focus ? "Unfocus":"Focus"}
          </IonItemOption>
        </IonItemOptions>

         <IonItem id="update-modal-trigger" color={activityData.focus ? "primary":activityData.full ? "danger":""}>
          <IonLabel slot='start'>{activityData.name}</IonLabel>
          <IonChip slot='end' color={activityData.focus ? "dark": activityData.full?"dark":"primary"}>{activityData.d_done} / {activityData.d_poms}</IonChip>
        </IonItem>

        <IonItemOptions side="end" onIonSwipe={e=>ModifyDoneCount(-1)}>
          <IonItemOption color="danger" expandable onClick={e=>ModifyDoneCount(-1)}>
            <IonIcon icon={remove}/>
          </IonItemOption>
        </IonItemOptions>
      </IonItemSliding>
}

interface ActivityData {
  id: string;
  name: string;
  maxDaily: number;
  poms: number;
  days: string;
  daily: boolean;
}

interface ActivityEditorModalProps {
  trigger: string;
  newActivity?: boolean | undefined;
  activityData?: ActivityData | undefined;
}

const ActivityEditorModal:React.FC<ActivityEditorModalProps>= ({trigger, newActivity, activityData}:ActivityEditorModalProps) => {
  const modal = useRef<HTMLIonModalElement>(null);
  const [activityType, setActivityType] = useState<'weekly'|'daily'>(newActivity ? 'weekly' : activityData?.daily ? 'daily' : 'weekly');
  const [activityName, setActivityName] = useState<string>(activityData?.name ?? '');
  const [maxDaily, setMaxDaily] = useState<number>(activityData?.maxDaily ?? 0);
  const [poms, setPoms] = useState<number>(activityData?.poms ?? 0);
  const [days, setDays] = useState<string>(activityData?.days ?? 'MTWRFSU');
  const {serverURL} = useServer();

  const segment = useRef<HTMLIonSegmentElement>(null);
  function segmentChange(event: SegmentCustomEvent){
    //Get the value of the segment as a string
    var value = event.detail.value as string;
    if (value === 'weekly' || value === 'daily'){
      setActivityType(value);
    }
    return;
  }
  function dismissAddActivityModal() {
    modal.current?.dismiss();
  }
  function updateDays(day: string) {
    //If the day is already in the list, remove it
    if (days.indexOf(day) > -1){
      setDays(days.replace(day, ''));
    }
    //Otherwise, add it
    else {
      setDays(days + day);
    }
  }
  function updateActivityName(e: InputCustomEvent) {
    e.detail.value && setActivityName(e.detail.value);
  }
  function updateMaxDaily(e: InputCustomEvent) {
    e.detail.value && setMaxDaily(parseInt(e.detail.value));
  }
  function updatePoms(e: InputCustomEvent) {
    e.detail.value && setPoms(parseInt(e.detail.value));
  }
  function ParseModalData(){
    var activity = {
      name: activityName,
      max: maxDaily,
      poms: poms,
      days: days,
      daily: activityType === 'daily'
    }
    //Send the data to the server
    fetch(serverURL + '/add_activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(activity)
    })
    //clean up the inputs
    setActivityName('');
    setMaxDaily(0);
    setPoms(0);
    setDays('MTWRFSU');

    console.log(activity);
    modal.current?.dismiss();
  }
  return(
        <IonModal id="add-activity-modal" trigger={trigger} ref={modal}>
          <IonHeader>
            <IonToolbar>
              <IonTitle slot="start">Add Activity</IonTitle>
              <IonButton slot="end" color="primary" onClick={dismissAddActivityModal}>Cancel</IonButton>
            </IonToolbar>
            </IonHeader>
            <IonSegment value={activityType} onIonChange={segmentChange} ref={segment}>
              <IonSegmentButton value="weekly">
                <IonLabel>Weekly</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="daily">
                <IonLabel>Daily</IonLabel>
              </IonSegmentButton>
            </IonSegment>
            <IonList>
              <IonItem>
                <IonLabel position='stacked'>Activity Name</IonLabel>
                <IonInput aria-label="name" value={activityName} onIonInput={updateActivityName}></IonInput>
              </IonItem>
              {activityType === 'weekly' && (
              <IonItem>
                <IonLabel slot='start'>Poms</IonLabel>
                <IonInput aria-label="poms" slot='end' type='number' value={poms !=0 ? poms:''} onIonInput={updatePoms}></IonInput>
              </IonItem>
              )}
              <IonItem>
                <IonLabel slot='start'>Max Daily</IonLabel>
                <IonInput aria-label="max-daily" slot='end' type='number' value={maxDaily != 0 ? maxDaily:''} onIonInput={updateMaxDaily}></IonInput>
              </IonItem>
              <IonItem>
                <IonGrid fixed={true}>
                  <IonCol className='ion-justify-content-center ion-padding-horizontal'>
                    {['M', 'T', 'W', 'R', 'F', 'S', 'U'].map((day, i) => (
                      <IonButton key={i} color={days.indexOf(day) > -1 ? "primary":"light"} onClick={e=>{
                        e.preventDefault();
                        updateDays(day);
                      }}>
                        <IonLabel>{day}</IonLabel>
                      </IonButton>
                    ))}
                  </IonCol>
                </IonGrid>
              </IonItem>
            </IonList>
            <IonButton onClick={e=>{
              e.preventDefault();
              ParseModalData();
            }}> Done</IonButton>
        </IonModal>
  )}

export default Tab1;
