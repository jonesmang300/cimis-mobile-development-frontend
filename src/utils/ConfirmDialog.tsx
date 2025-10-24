import React from "react";
import { IonAlert } from "@ionic/react";

interface ConfirmDialogProps {
  isOpen: boolean;
  header?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  header = "Confirm",
  message,
  confirmText = "Yes",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) => {
  return (
    <IonAlert
      isOpen={isOpen}
      header={header}
      message={message}
      buttons={[
        {
          text: cancelText,
          role: "cancel",
          handler: onCancel,
        },
        {
          text: confirmText,
          handler: onConfirm,
        },
      ]}
      onDidDismiss={onCancel}
    />
  );
};

export default ConfirmDialog;
