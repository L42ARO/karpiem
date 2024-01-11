import { InputChangeEventDetail, InputCustomEvent, IonBadge, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonChip, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonListHeader, IonModal, IonPage, IonRefresher, IonRefresherContent, IonRow, IonSegment, IonSegmentButton, IonTitle, IonToolbar, RefresherEventDetail, SegmentChangeEventDetail, SegmentCustomEvent } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import './Tab1.css';
import { add, reload, remove, timeOutline } from 'ionicons/icons';
import { FormEventHandler, useEffect, useRef, useState } from 'react';
import { useServer } from '../context/serverContext';

interface DayActivityResponse{
  id: string;
  name: string;
  d_poms: number;
  d_done: number;
  full: boolean;
}
interface DayActivitiesResponse{
  dailies: DayActivityResponse[];
  options: DayActivityResponse[];
  total_poms: number;
  total_done: number;
}

const Tab1: React.FC = () => {
  const {serverURL} = useServer();
  const [dayActivitiesResponse, setDayActivitiesResponse] = useState<DayActivitiesResponse>();
  const [total_poms, setTotalPoms] = useState<number>(0);
  const [total_done, setTotalDone] = useState<number>(0);

  function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    setTimeout(() => {
      getDayActivities();
      event.detail.complete();
    }, 1000);
  }
  useEffect(() => {
    getDayActivities();
  }, []);
  function getDayActivities(){
    fetch(serverURL + '/day_activities')
    .then(res => res.json())
    .then((data: DayActivitiesResponse) => {
      console.log(data);
      setDayActivitiesResponse(data);
      setTotalDone(data.total_done);
      setTotalPoms(data.total_poms);
    })
    .catch(console.log)
  }
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
          <IonToolbar>
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
          <IonToolbar>
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
          <IonChip slot='end' color='primary'>{activityData.d_done} / {activityData.d_poms}</IonChip>
        </IonItem>

        <IonItemOptions side="end">
          <IonItemOption color="danger">
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
                <IonInput aria-label="poms" slot='end' type='number' value={poms !=0 ? poms:''} onIonChange={updatePoms}></IonInput>
              </IonItem>
              )}
              <IonItem>
                <IonLabel slot='start'>Max Daily</IonLabel>
                <IonInput aria-label="max-daily" slot='end' type='number' value={maxDaily != 0 ? maxDaily:''} onIonChange={updateMaxDaily}></IonInput>
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
