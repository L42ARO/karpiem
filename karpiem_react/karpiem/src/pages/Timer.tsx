import { IonButton, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonPage, IonTitle, IonToolbar } from "@ionic/react"
import { add, play, reload } from "ionicons/icons";
import { useState } from "react";
import { useServer } from "../context/serverContext";

export const Timer:React.FC = () => {
    const [time, setTime] = useState<number>(0);
    const {showToast} = useServer();
    const testNotification = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Permission granted, trigger the timer in the service worker
          setTimeout(() => {
              navigator.serviceWorker.controller?.postMessage({ action: `notifyTimer`, value: time });
          }, time);
          showToast(`Timer started for ${time} seconds`, "success");
        } else {
          console.warn('Permission for notifications denied');
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }
    const UpdateTime = (event: CustomEvent)=>{
        setTime(event.detail.value);
    }
    return <IonPage>
        <IonHeader id="header">
          <IonToolbar>
            
            <IonTitle>Day</IonTitle>
          </IonToolbar>
        </IonHeader>

      <IonContent fullscreen={true} className='ion-padding-top'>
            <IonItem>
                <IonInput type="number" placeholder="Enter time in seconds" onIonInput={UpdateTime}/>
                <IonButton color="primary" slot="end" onClick={()=>testNotification()}>
                  <IonIcon icon={play} />
                </IonButton>
            </IonItem>
      </IonContent>
    </IonPage>
}