import { InputChangeEventDetail, InputCustomEvent, IonBadge, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonChip, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonListHeader, IonModal, IonPage, IonRefresher, IonRefresherContent, IonRow, IonSegment, IonSegmentButton, IonTitle, IonToast, IonToolbar, ItemSlidingCustomEvent, RefresherEventDetail, SegmentChangeEventDetail, SegmentCustomEvent, useIonToast } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import '../theme/custom_global.css';
import { add, create, play, reload, remove, stop, timeOutline } from 'ionicons/icons';
import { useServer } from '../context/serverContext';
import { FormEventHandler, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Activity, GetAllActivitiesResponse, UpdateActivityResponse, UpdateFocusRequest } from '../context/dataContext';

export interface SimplifiedActivity{
  id: string;
  name: string;
  d_poms: number;
  w_poms: number;
  d_done: number;
  w_done: number;
  days: string;
  full: boolean;
  focus: boolean;
  active: boolean;
}
export interface ActivityItemProps {
  activityData: SimplifiedActivity;
  week_view?: boolean;
  blocked?: boolean;
  daily?: boolean;
  override_func?: (n:number, changeDone: (poms_done: number, override_key?: string) => Promise<void>) => void;
  edit_func?: (activity: SimplifiedActivity, newActivity: boolean, daily?:boolean) => void;
}


export const ActivityItem:React.FC<ActivityItemProps>= (
    {activityData, week_view, blocked, override_func, edit_func, daily}:ActivityItemProps
) => {
  const [poms_done, setPomsDone] = useState<number>(!week_view?activityData.d_done:activityData.w_done);
  const {serverURL, showToast} = useServer();
  const slider = useRef<HTMLIonItemSlidingElement>(null);
  function ModifyDoneCount(n: number){
    const check1 = (n<0 && poms_done> 0) || (n>0 && !activityData.full);
    const check2 = (n<0 || !blocked);
    if (check1){
        //if (check2){
            setPomsDone(poms_done + n);
        //}
    }
    //if(n > 0 && (activityData.full || blocked)){
    //    showToast("You need to provide permission", "warning");
    //    override_func?.(poms_done+n, ChangeDone);
    //}
    slider.current?.close();
  }
  async function FocusActivity(){
    var focus = !activityData.focus;
    var request:UpdateFocusRequest = {
        id: activityData.id,
        focus: focus,
        focus_time: 0,
        room_id:"123456789"
    };
    try{
      var res = await fetch(serverURL + '/focus_activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })
      if (res.ok){
        const data: Activity = await res.json();
      }
      else if(res.status == 409){ //Conflict
        const data = await res.json() as Activity;
        showToast(`Activity ${data.name} already in focus`, "primary");
      }
      else{
        const txt = await res.text();
        throw new Error(txt);
      }
      slider.current?.close();
    }catch(err){
      console.log(err);
      showToast(`Error focusing: ${(err as Error).message}`, "danger");
    }
  }
  useEffect(() => {
    if(!week_view){
        if(activityData.d_done != poms_done)
        setPomsDone(activityData.d_done);
    }
    else{
        if(activityData.w_done != poms_done)
            setPomsDone(activityData.w_done);
    }
  }, [activityData]);

  useEffect(() => {
    if((!week_view && poms_done != activityData.d_done)||(week_view && poms_done != activityData.w_done)){
      //Send updated done count to server
      ChangeDone(poms_done);
    }
  }, [poms_done]);
  async function ChangeDone(poms_done: number, override_key?: string){
        if (!override_key) override_key = "";
      try{
        const res = await fetch(serverURL + '/change_done', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            d_or_w: !week_view,
            id: activityData.id,
            value: poms_done,
            day_blocked: blocked,
            override_key: override_key,
            room_id:"123456789"
          })
        });
        if (!res.ok){
          const txt = await res.text();
          throw new Error(txt);
        }

      }catch(err){
        console.log(err);
        showToast(`Error changing done count: ${(err as Error).message}`, "danger");
      }
  }
    // useImperativeHandle(ref, () => ({
    //     changeDone: ChangeDone,
    // }));

  return <IonItemSliding ref={slider}>
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
          <IonButton fill="clear" color="medium" onClick={e=>edit_func?.(activityData, false, daily)}>
            <IonIcon icon={create}/>
            </IonButton>
          <IonChip slot='end' color={activityData.focus ? "dark": activityData.full?"dark":"primary"}>
            {!week_view?activityData.d_done:activityData.w_done}
            /
            {!week_view?activityData.d_poms:activityData.w_poms}
          </IonChip>
        </IonItem>

        <IonItemOptions side="end" onIonSwipe={e=>ModifyDoneCount(-1)}>
          <IonItemOption color="danger" expandable onClick={e=>ModifyDoneCount(-1)}>
            <IonIcon icon={remove}/>
          </IonItemOption>
        </IonItemOptions>
      </IonItemSliding>
}

// export const ForwardedActivityItem = forwardRef(ActivityItem);