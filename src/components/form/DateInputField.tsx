import React from "react";
import { useField } from "formik";
import { IonItem, IonLabel, IonDatetime, IonText } from "@ionic/react";

const DateInputField: React.FC<{ name: string; label: string; placeholder: string; id: string }> = ({
  name,
  label,
  placeholder,
  id,
}) => {
  const [field, meta, helpers] = useField(name);

  return (
    <IonItem>
      <IonLabel position="stacked">{label}</IonLabel>
      <IonDatetime
        id={id}
        placeholder={placeholder}
        value={field.value}
        onIonChange={(e) => helpers.setValue(e.detail.value!)}
      />
      {meta.touched && meta.error ? (
        <IonText color="danger">
          <p>{meta.error}</p>
        </IonText>
      ) : null}
    </IonItem>
  );
};

export default DateInputField;
