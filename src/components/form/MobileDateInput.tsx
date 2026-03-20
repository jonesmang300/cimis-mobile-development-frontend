import React, { useRef } from "react";
import { IonButton, IonIcon, IonInput } from "@ionic/react";
import { calendarOutline } from "ionicons/icons";

type MobileDateInputProps = {
  id?: string;
  value?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  onIonInput?: (event: CustomEvent) => void;
  onIonChange?: (event: CustomEvent) => void;
};

const MobileDateInput: React.FC<MobileDateInputProps> = ({
  id,
  value,
  placeholder,
  min,
  max,
  onIonInput,
  onIonChange,
}) => {
  const inputRef = useRef<HTMLIonInputElement | null>(null);

  const openPicker = async () => {
    const input = await inputRef.current?.getInputElement();
    if (!input) return;

    if (typeof (input as HTMLInputElement & { showPicker?: () => void }).showPicker === "function") {
      (input as HTMLInputElement & { showPicker: () => void }).showPicker();
      return;
    }

    input.focus();
    input.click();
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
      }}
    >
      <IonInput
        ref={inputRef}
        id={id}
        type="date"
        value={value || ""}
        placeholder={placeholder}
        min={min}
        max={max}
        onIonInput={onIonInput}
        onIonChange={onIonChange}
      />
      <IonButton
        fill="clear"
        color="medium"
        onClick={openPicker}
        aria-label="Open date picker"
        style={{ margin: 0 }}
      >
        <IonIcon icon={calendarOutline} />
      </IonButton>
    </div>
  );
};

export default MobileDateInput;
