// import React from "react";
// import { useField } from "formik";
// import { IonItem, IonLabel, IonDatetime, IonText } from "@ionic/react";

// const DateInputField: React.FC<{ name: string; label: string; placeholder: string; id: string }> = ({
//   name,
//   label,
//   placeholder,
//   id,
// }) => {
//   const [field, meta, helpers] = useField(name);

//   return (
//     <IonItem>
//       <IonLabel position="stacked">{label}</IonLabel>
//       <IonDatetime
//         id={id}
//         placeholder={placeholder}
//         value={field.value}
//         onIonChange={(e) => helpers.setValue(e.detail.value!)}
//       />
//       {meta.touched && meta.error ? (
//         <IonText color="danger">
//           <p>{meta.error}</p>
//         </IonText>
//       ) : null}
//     </IonItem>
//   );
// };

// export default DateInputField;

import React from "react";
import { useField } from "formik";
import { IonItem, IonLabel, IonDatetime, IonText } from "@ionic/react";

interface DateInputFieldProps {
  name: string;
  label: string;
  id: string;
}

const DateInputField: React.FC<DateInputFieldProps> = ({ name, label, id }) => {
  const [field, meta, helpers] = useField(name);

  const handleChange = (e: CustomEvent) => {
    const value = e.detail.value as string | null;
    helpers.setValue(value || "");
  };

  return (
    <IonItem>
      <IonLabel position="stacked">{label}</IonLabel>
      <IonDatetime
        id={id}
        value={field.value || ""}
        onIonChange={handleChange}
        presentation="date"
        showDefaultButtons
      />
      {meta.touched && meta.error && (
        <IonText color="danger">
          <p>{meta.error}</p>
        </IonText>
      )}
    </IonItem>
  );
};

export default DateInputField;
