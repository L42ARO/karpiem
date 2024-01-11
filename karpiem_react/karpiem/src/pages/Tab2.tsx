import { IonButton, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonPage, IonRefresher, IonRefresherContent, IonRow, IonTitle, IonToolbar, RefresherEventDetail } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import './Tab2.css';
import { add, reload, timeOutline } from 'ionicons/icons';
import { useEffect, useState } from 'react';

const Tab2: React.FC = () => {
  const [today, setToday] = useState<'M' | 'T' | 'W' | 'R' | 'F' | 'S' | 'U'>('M');
  
  useEffect(() => {
    //Figure out what day it is
    const present = new Date();
    const day = present.getDay();
    setToday(day == 0 ? 'U' : day == 1 ? 'M' : day == 2 ? 'T' : day == 3 ? 'W' : day == 4 ? 'R' : day == 5 ? 'F' : 'S');
  }, []);
  function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    setTimeout(() => {
      event.detail.complete();
    }, 1000);
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
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Tab2;
