import { useEffect, useRef, useState } from "react";
import { SimplifiedActivity } from "./ActivityItem";
import { useServer } from "../context/serverContext";
import { InputCustomEvent, IonButton, IonButtons, IonCol, IonFooter, IonGrid, IonHeader, IonInput, IonItem, IonLabel, IonList, IonSegment, IonSegmentButton, IonTitle, IonToggle, IonToolbar, SegmentCustomEvent } from "@ionic/react";
import { Activity, DeleteActivityRequest, DeleteActivityResponse, UpdateActivityRequest } from "../context/dataContext";

export interface ActivityEditorModalProps{
  onDismiss: (data?: string | null | undefined | number, role?: string) => void;
  activityData?: SimplifiedActivity;
  newActivity: boolean;
  daily: boolean;
}
export const ActivityEditorModal = ({
  onDismiss,
  newActivity,
  daily,
  activityData
}: ActivityEditorModalProps) => {
  const [activityType, setActivityType] = useState<'weekly'|'daily'>(newActivity ? 'weekly' : daily ? 'daily' : 'weekly');
  const [activityName, setActivityName] = useState<string>(activityData?.name ?? '');
  const [activityActive, setActivityActive] = useState<boolean>(activityData?.active ?? true);
  const [maxDaily, setMaxDaily] = useState<number>(activityData?.d_poms ?? 0);
  const [poms, setPoms] = useState<number>(activityData?.w_poms ?? 0);
  const [days, setDays] = useState<string>(activityData?.days ?? 'MTWRFSU');
  const {serverURL, showToast} = useServer();
  const activityNameRef = useRef<HTMLIonInputElement>(null);
  const maxDailyRef = useRef<HTMLIonInputElement>(null);
  const pomsRef = useRef<HTMLIonInputElement>(null);

  const segment = useRef<HTMLIonSegmentElement>(null);
  function segmentChange(event: SegmentCustomEvent){
    //Get the value of the segment as a string
    var value = event.detail.value as string;
    if (value === 'weekly' || value === 'daily'){
      setActivityType(value);
    }
    return;
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
  function updateActivityActive(e: CustomEvent) {
    e.detail && setActivityActive(e.detail.checked);
  }
  function ParseModalData(){
    var valid = ValidateForm();
    if (!valid) return;

    if(newActivity){
      var activity = {
        name: activityName,
        max: maxDaily,
        poms: poms,
        days: days,
        daily: activityType === 'daily',
        room_id: "123456789"
      }
    //Send the data to the server
      fetch(serverURL + '/add_activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(activity)
      })
    }
    else{
      UpdateActivity();
    }
    //clean up the inputs
    setActivityName('');
    setMaxDaily(0);
    setPoms(0);
    setDays('MTWRFSU');
    onDismiss()
  }
  function ValidateForm(){
    //Go through the inputs and make sure they are valid
    var invalildInputs = [];
    if(activityNameRef.current?.value as String== ""){
      //Use the label to get the name of the input
      invalildInputs.push(activityNameRef.current?.ariaLabel);
    }
    if(activityType === 'weekly' && (pomsRef.current?.value== "" || poms <= 0)){
      invalildInputs.push(pomsRef.current?.ariaLabel);
    }
    if(maxDailyRef.current?.value == "" || maxDaily<=0){
      invalildInputs.push(maxDailyRef.current?.ariaLabel);
    }
    if(days.length == 0){
      invalildInputs.push("Days");
    }
    
    if (invalildInputs.length > 0){
      //Show a toast with the invalid inputs
      showToast(`Invalid fields: ${invalildInputs.join(', ')}`, "danger");
      return false;
    }
    return true;
  }
  async function UpdateActivity(){
    if(!activityData) return;
    var request:UpdateActivityRequest={
      id: activityData.id,
      active: activityActive,
      daily: activityType === 'daily',
      name: activityName,
      days: days,
      poms: poms,
      max: maxDaily,
      room_id: "123456789"
    }
    try{
      var res = await fetch(serverURL + '/update_activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })
      if (res.ok){
        const data: Activity = await res.json();
        showToast(`Activity ${data.name} updated`, "primary");
      }
      else{
        const txt = await res.text();
        throw new Error(txt);
      }
    }catch(err){
      console.log(err);
      showToast(`Error updating activity: ${(err as Error).message}`, "danger");
    }
  }
  useEffect(() => {
    if(activityType === 'daily'){
      setPoms(maxDaily*7);
    }
  }, [maxDaily]);
  async function DeleteActivity(){
    if(!activityData) return;
    var request:DeleteActivityRequest={
        id: activityData.id,
        room_id: "123456789"
    }
    try{
      var res = await fetch(serverURL + '/delete_activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })
      if (res.ok){
        const data: DeleteActivityResponse= await res.json();
        //Double check the id is the same
        if (data.deleted_id !== activityData.id){
          throw new Error("Deleted activity id does not match");
        }
        showToast(`Activity ${data.deleted_name} deleted`, "primary");
        onDismiss();
      }
      else{
        const txt = await res.text();
        throw new Error(txt);
      }
    }catch(err){
      console.log(err);
      showToast(`Error deleting activity: ${(err as Error).message}`, "danger");
    }
  }
  return(
        // <IonModal className='translucent-modal' id="add-activity-modal" trigger={trigger} ref={modal}>
        <>
          <IonHeader>
            <IonToolbar>
              <IonButtons>
                <IonButton slot="start" color="medium" onClick={()=>onDismiss(null, "cancel")} strong={true}>Cancel</IonButton>
                <IonTitle>
                  {newActivity ? "Add Activity" : "Edit Activity"}
                </IonTitle>
                <IonButton slot="end" strong={true} onClick={e=>
                  ParseModalData()
                }> Done</IonButton>
              </IonButtons>
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
                <IonInput ref={activityNameRef} aria-label="Activity Name" value={activityName} onIonInput={updateActivityName}></IonInput>
              </IonItem>
              {activityType === 'weekly' && (
              <IonItem>
                <IonLabel slot='start'>Max Week Poms</IonLabel>
                <IonInput ref={pomsRef} aria-label="Max Week Poms" slot='end' type='number' value={poms !=0 ? poms:''} onIonInput={updatePoms}></IonInput>
              </IonItem>
              )}
              <IonItem>
                <IonLabel slot='start'>Max Daily Poms</IonLabel>
                <IonInput ref={maxDailyRef} aria-label="Max Daily Poms" slot='end' type='number' value={maxDaily != 0 ? maxDaily:''} onIonInput={updateMaxDaily}></IonInput>
              </IonItem>
              <IonItem>
                <IonGrid>
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
            {!newActivity&&
            <IonFooter>
                <IonToolbar>
                        <IonItem slot="start">
                          <IonToggle enableOnOffLabels={true} checked={activityActive} onIonChange={updateActivityActive}>Active</IonToggle>;
                        </IonItem>
                        <IonButton slot="end" strong={true} color="danger" onClick={e=>DeleteActivity()}>
                            Delete
                        </IonButton>
                </IonToolbar>
            </IonFooter>
            }
            
        </>
  )}