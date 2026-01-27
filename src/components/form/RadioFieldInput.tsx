"use client";
import React, { FC, useEffect } from "react";
import { IonRadioGroup, IonRadio, IonLabel, IonItem } from "@ionic/react";
import { useFormikField } from "../../hooks/UseFormikField";

type Prop = {
  label: string;
  name: string;
  options: Array<{ label: string; value: string | number }>;
  getValue?: (value: any) => void;
  row?: boolean;
  disabled?: boolean;
};

export const RadioGroupInput: FC<Prop> = ({
  label,
  name,
  options,
  getValue,
  row,
  disabled = false,
}) => {
  const { value, handleChange, hasError, errorMessage, setFieldValue } =
    useFormikField(name);

  useEffect(() => {
    if (getValue) getValue(value);
  }, [value]);

  return (
    <div style={{ display: "flex", flexDirection: "column", margin: "8px 0" }}>
      <label
        htmlFor={name}
        style={{ marginBottom: "8px", paddingLeft: "15px", color: "#4CAF50" }}
      >
        {label}
      </label>
      <IonRadioGroup
        id={name}
        name={name}
        value={value}
        onIonChange={(e) => {
          setFieldValue(name, e.detail.value);
          handleChange(e.detail.value);
        }}
      >
        {options.map(({ label, value }) => (
          <IonItem key={value} disabled={disabled}>
            <IonLabel>{label}</IonLabel>
            <IonRadio slot="start" value={value} />
          </IonItem>
        ))}
      </IonRadioGroup>
      {hasError && (
        <span style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
          {errorMessage}
        </span>
      )}
    </div>
  );
};
