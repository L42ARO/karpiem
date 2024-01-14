import { IonButton, IonButtons, IonHeader, IonInput, IonItem, IonTitle, IonToolbar } from "@ionic/react";
import { useRef } from "react";

export const OverrideModal = ({
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
          <IonTitle>Override</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => onDismiss(inputRef.current?.value, 'confirm')} strong={true}>
              Confirm
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonItem>
        <IonInput ref={inputRef} labelPlacement="stacked" label="Override Key" placeholder="* * * *" />
      </IonItem>
    </>
  );
};