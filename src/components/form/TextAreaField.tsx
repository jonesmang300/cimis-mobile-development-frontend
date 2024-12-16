import React from "react";
import { Field } from "formik";
import { IonLabel, IonTextarea, IonItem, IonText } from "@ionic/react";

interface TextAreaFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  id?: string;
}

const TextAreaField: React.FC<TextAreaFieldProps> = ({ name, label, placeholder, id }) => {
  return (
    <IonItem>
      <IonLabel position="stacked">{label}</IonLabel>
      <Field name={name}>
        {({ field, form }: any) => (
          <>
            <IonTextarea
              {...field}
              placeholder={placeholder}
              id={id}
              onIonChange={(e) => form.setFieldValue(name, e.detail.value)}
            />
            {form.touched[name] && form.errors[name] && (
              <IonText color="danger">{form.errors[name]}</IonText>
            )}
          </>
        )}
      </Field>
    </IonItem>
  );
};

export default TextAreaField;
