import { IonAvatar, IonButton, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import './Tab3.css';
import { add, playBackCircle, playSkipBackCircle, reload } from 'ionicons/icons';
import { useServer } from '../context/serverContext';

const Tab3: React.FC = () => {
  var {serverURL} = useServer();
  //Make async function to reset day counts
  async function resetDayCounts(){
    const res = await fetch(serverURL + '/reset_day?room_id='+"123456789");
    //There won't be any data to return just the OK status
    if (res.ok){
      console.log("Day counts reset");
    }
    else{
      console.log("Error resetting day counts");
    }
  }
  async function resetWeekCounts(){
    const res = await fetch(serverURL + '/reset_week?room_id='+"123456789");
    //There won't be any data to return just the OK status
    if (res.ok){
      console.log("Week counts reset");
    }
    else{
      console.log("Error resetting week counts");
    }
  }
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          
          <IonTitle>Settings</IonTitle>
          
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen={true} className='ion-padding-top'>
        <IonList>
      <IonItem className='ion-padding'>
        <IonAvatar slot="start">
          <img alt="Silhoute of a person's head" src="https://ionicframework.com/docs/img/demos/avatar.svg" />
        </IonAvatar>
        <IonTitle size="large">L42ARO</IonTitle>
      </IonItem>
      <IonItem>
        <IonLabel slot='start'>Day Max</IonLabel>
        <IonInput aria-label="max-poms-day" slot='end' type="number" value={12}></IonInput>
      </IonItem>
      <IonItem>
        <IonLabel slot='start'>Week Max</IonLabel>
        <IonInput aria-label='max-poms-week' slot='end'type="number" value={88}></IonInput>
      </IonItem>
          <IonButton shape='round' expand='block' onClick={e=>{
            e.preventDefault();
            resetDayCounts();
          }}>
            <IonIcon slot='start' icon={playSkipBackCircle} />
            <IonLabel slot='end'>Reset Day Counts</IonLabel>
          </IonButton>
          <IonButton shape='round' expand='block' onClick={e=>{
            e.preventDefault();
            resetWeekCounts();
          }}>
            <IonIcon slot='start' icon={playBackCircle} />
            <IonLabel slot='end'>Reset Week Counts</IonLabel>
          </IonButton>
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Tab3;
