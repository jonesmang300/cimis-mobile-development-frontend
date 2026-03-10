import React from "react";
import {
  IonBadge,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonIcon,
  IonSpinner,
} from "@ionic/react";
import type { IconDefinition } from "ionicons/icons";

type BadgeColor = "success" | "warning" | "primary" | "secondary" | "tertiary" | "danger" | "light" | "medium" | "dark";

interface DashboardStatCardProps {
  subtitle: string;
  icon: IconDefinition;
  routerLink: string;
  loading?: boolean;
  value?: number | string;
  badgeColor?: BadgeColor;
}

const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  subtitle,
  icon,
  routerLink,
  loading = false,
  value,
  badgeColor = "success",
}) => {
  const showBadge = value !== undefined && value !== null;

  return (
    <IonCard className="green-card" routerLink={routerLink} button>
      <IonCardHeader>
        <IonIcon icon={icon} size="large" className="card-icon" />

        <IonCardSubtitle>{subtitle}</IonCardSubtitle>

        <IonCardTitle>
          {loading ? (
            <IonSpinner name="crescent" />
          ) : showBadge ? (
            <IonBadge color={badgeColor}>
              {typeof value === "number" ? value.toLocaleString() : value}
            </IonBadge>
          ) : (
            ""
          )}
        </IonCardTitle>
      </IonCardHeader>
    </IonCard>
  );
};

export default DashboardStatCard;
