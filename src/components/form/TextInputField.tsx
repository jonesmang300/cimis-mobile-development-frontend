import React, { FC, useEffect } from "react";
import { IonInput, IonItem, IonTextarea } from "@ionic/react";
import { useFormikField } from "../../hooks/UseFormikField";

type Prop = {
  id: string;
  name: string;
  label: string;
  type?: "password" | "text" | "date" | "number";
  placeholder?: string;
  rows?: number;
  getValue?: (value: any) => void;
  disabled?: boolean;
  multiline?: boolean;
};

export const TextInputField: FC<Prop> = ({
  id,
  name,
  label,
  type = "text",
  placeholder = "",
  rows = 4,
  getValue,
  disabled = false,
  multiline = false,
}) => {
  const { value, handleChange, hasError, errorMessage, handleBlur } =
    useFormikField(name);

  useEffect(() => {
    if (getValue) {
      getValue(value);
    }
  }, [value, getValue]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        margin: "16px 0",
        padding: "12px",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <label
        htmlFor={name}
        style={{
          marginBottom: "6px",
          fontWeight: "600",
          fontSize: "14px",
          color: "#4CAF50",
        }}
      >
        {label}
      </label>

      <IonItem
        lines="none"
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "6px",
          padding: "0 8px",
          border: hasError ? "1px solid red" : "1px solid #ccc",
        }}
      >
        {multiline ? (
          <IonTextarea
            id={id}
            name={name}
            value={value || ""}
            rows={rows}
            placeholder={placeholder}
            disabled={disabled}
            onIonChange={(e: any) => handleChange(e.detail.value)}
            onIonBlur={handleBlur}
          />
        ) : (
          <IonInput
            id={id}
            name={name}
            type={type}
            value={value || ""}
            placeholder={placeholder}
            disabled={disabled}
            onIonChange={(e: any) => handleChange(e.detail.value)}
            onIonBlur={handleBlur}
          />
        )}
      </IonItem>

      {hasError && (
        <div
          style={{
            marginTop: "6px",
            color: "red",
            fontSize: "12px",
          }}
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
};
