import { IonAvatar, IonButton, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonPage, IonRow, IonTitle, IonToolbar } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import './Tab3.css';
import { add, playBackCircle, playSkipBackCircle, reload } from 'ionicons/icons';
import { useServer } from '../context/serverContext';
import { Setting } from '../context/dataContext';
import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

const Tab3: React.FC = () => {
  var { serverURL, showToast } = useServer();
  //Make async function to reset day counts
  const max_ref = useRef<HTMLIonInputElement>(null);
  const daysRefs = ["M", "T", "W", "R", "F", "S", "U"].map((day, index) => useRef<HTMLIonInputElement>(null));
  const [settings, setSettings] = React.useState<Setting | null>(null);
  const [days_max, setDaysMax] = React.useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const location = useLocation();

  useEffect(() => {
    //Check if it's current location programmatically
    if (location.pathname === '/tab3') {
      getSettings();
    }
  }, [location]);
  useEffect(() => {
    getSettings();
  }, []);
  useEffect(() => {
    if (settings) {
      //Get the days_max from the settings
      const days_max = settings.days_max;
      //Convert the days_max to a number array
      var days_max_array = [];
      for (var i = 0; i < days_max.length; i += 2) {
        days_max_array.push(parseInt(days_max.substring(i, i + 2), 16));
      }
      console.log(days_max_array);
      setDaysMax(days_max_array);
    }
  }, [settings]);

  async function getSettings() {
    try {
      const res = await fetch(serverURL + '/get_setting');
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }
      const data = await res.json();
      setSettings(data);
      console.log(data as Setting);
    }
    catch (err) {
      console.log(err);
      showToast(`Error getting setting: ${(err as Error).message}`, "danger")
    }
  }


  async function resetDayCounts() {
    try {
      const res = await fetch(serverURL + '/reset_day?room_id=' + "123456789");
      //There won't be any data to return just the OK status
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }
      console.log("Day counts reset");
    } catch (err) {
      console.log(err);
      showToast(`Error resetting day counts: ${(err as Error).message}`, "danger")
    }
  }
  async function resetWeekCounts() {
    try {
      const res = await fetch(serverURL + '/reset_week?room_id=' + "123456789");
      //There won't be any data to return just the OK status
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }
      console.log("Week counts reset");
    } catch (err) {
      console.log(err);
      showToast(`Error resetting week counts: ${(err as Error).message}`, "danger")
    }
  }
  async function settingsChange() {
    //Get the values from the inputs
    const max = Number(max_ref.current?.value);
    const days = daysRefs.map(ref => Number(ref.current?.value));
    //Convert days to a string of hex values where each 2 characters is a day
    var hexString = "";
    days.forEach(day => {
      //Convert the day to a hex string
      var hexDay = (day as number).toString(16);
      //If the hexDay is only 1 character long add a 0 to the front
      if (hexDay?.length == 1) {
        hexDay = "0" + hexDay;
      }
      hexString += hexDay;
    });
    //Make the request to the server
    try {
      const res = await fetch(serverURL + '/update_setting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          days_max: hexString,
          week_max: max
        })
      });
      if (res.ok) {
        console.log("Settings updated");
      }
      else if (res.status == 207) { //Multi-status
        console.log("Settings updated, but issue with WebSockets");
      }
      else {
        const txt = await res.text();
        throw new Error(txt);

      }
    }
    catch (err) {
      console.log(err);
      showToast(`Error updating settings: ${(err as Error).message}`, "danger")
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
        <IonGrid className='ion-no-padding'>
          <IonRow className='ion-justify-content-center'>
            <IonCol size="12" sizeLg="8">
              <IonList>
                <IonItem className='ion-padding'>
                  <IonAvatar slot="start">
                    <img alt="Silhoute of a person's head" src="https://ionicframework.com/docs/img/demos/avatar.svg" />
                  </IonAvatar>
                  <IonTitle size="large">L42ARO</IonTitle>
                </IonItem>
                <IonItem>
                  <IonGrid>
                    <IonRow className='ion-justify-content-center'>
                      {["M", "T", "W", "R", "F", "S", "U"].map((day, index) => (
                        <IonCol key={index} className='center-content' size-md="0.5">
                          <span><b>{day}</b></span>
                          <div className='day-circle'>
                            <IonInput ref={daysRefs[index]} aria-label='poms-today' type="number" className='center' value={days_max[index]} onIonInput={e => settingsChange()}></IonInput>
                          </div>
                        </IonCol>
                      ))}
                    </IonRow>
                  </IonGrid>
                </IonItem>
                <IonItem>
                  <IonLabel slot='start'>Week Max</IonLabel>
                  <IonInput ref={max_ref} aria-label='max-poms-week' slot='end' type="number" value={88}></IonInput>
                </IonItem>
                <IonButton shape='round' expand='block' onClick={e => {
                  e.preventDefault();
                  resetDayCounts();
                }}>
                  <IonIcon slot='start' icon={playSkipBackCircle} />
                  <IonLabel slot='end'>Reset Day Counts</IonLabel>
                </IonButton>
                <IonButton shape='round' expand='block' onClick={e => {
                  e.preventDefault();
                  resetWeekCounts();
                }}>
                  <IonIcon slot='start' icon={playBackCircle} />
                  <IonLabel slot='end'>Reset Week Counts</IonLabel>
                </IonButton>
              </IonList>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Tab3;
