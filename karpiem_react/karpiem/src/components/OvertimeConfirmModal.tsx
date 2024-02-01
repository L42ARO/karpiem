import { IonButton, IonButtons, IonHeader, IonInput, IonItem, IonLabel, IonTitle, IonToolbar } from "@ionic/react";
import { useRef } from "react";

export const OvertimeConfirmModal = ({
  onDismiss,
}: {
  onDismiss: (data?: string | null | undefined | number, role?: string) => void;
}) => {
  const inputRef = useRef<HTMLIonInputElement>(null);
  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton color="medium" onClick={() => onDismiss(null, 'cancel')}>
              Cancel
            </IonButton>
          </IonButtons>
          <IonTitle>Overtime?</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => onDismiss("1234", 'confirm')} strong={true}>
              Confirm
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonItem>
        <IonLabel>
          ⚠️ You are going overtime on this activity. Are you sure you want to focus on it?
        </IonLabel>
      </IonItem>
    </>
  );
};