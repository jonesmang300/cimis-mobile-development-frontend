import React, { FC, useEffect } from "react";
import { IonInput, IonItem, IonTextarea } from "@ionic/react";
import { useFormikField } from "../../hooks/UseFormikField";

type Prop = {
  id: string;
  name: string;
  label: string;
  width?: any;
  type?: "password" | "text" | "date" | "number";
  placeholder?: string;
  rows?: number;
  getValue?: (value: any) => void;
  size?: "small" | "medium";
  showHelperText?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  unitOfMeasure?: string;
  inputIcon?: any;
  helperTextWidth?: string;
  handleBlurEvent?: (value: any) => void;
};

export const TextInputField: FC<Prop> = ({
  id,
  name,
  label,
  type = "text",
  placeholder = "",
  size = "medium",
  rows = 4, // Default number of rows for textarea
  getValue,
  showHelperText = true,
  disabled = false,
  multiline = false,
  inputIcon,
  unitOfMeasure,
  helperTextWidth = "25ch",
  handleBlurEvent,
}) => {
  const { value, handleChange, hasError, errorMessage, handleBlur } =
    useFormikField(name);

  useEffect(() => {
    getValue && getValue(value);
  }, [value]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        margin: "16px 0",
        padding: "12px",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
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
        lines="none" // Removes the lines
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
            value={value}
            rows={rows}
            onIonInput={(e) => handleChange(e)}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            style={{
              padding: "10px",
              fontSize: "14px",
              borderRadius: "6px",
            }}
          />
        ) : (
          <IonInput
            id={id}
            type={type}
            name={name}
            value={value}
            onIonInput={(e) => handleChange(e)}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            style={{
              padding: "10px",
              fontSize: "14px",
              borderRadius: "6px",
            }}
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
