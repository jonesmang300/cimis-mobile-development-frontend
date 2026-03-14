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
  const { value, handleChange, hasError, errorMessage } = useFormikField(name);

  useEffect(() => {
    if (getValue) {
      getValue(value);
    }
  }, [value, getValue]);

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
        onIonChange={(e) => handleChange(e.detail.value)}
      >
        {options.map((option) => (
          <IonItem key={option.value} disabled={disabled}>
            <IonLabel>{option.label}</IonLabel>
            <IonRadio slot="start" value={option.value} />
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
