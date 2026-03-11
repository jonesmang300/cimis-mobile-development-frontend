import React, { ComponentProps } from "react";
import {
  IonBadge,
  IonCard,
  IonCardContent,
  IonIcon,
  IonSpinner,
} from "@ionic/react";

type IconDefinition = ComponentProps<typeof IonIcon>["icon"];

interface DashboardStatCardProps {
  title: string;
  helper?: string;
  icon: IconDefinition;
  accentClass: string;
  routerLink?: string;
  loading?: boolean;
  value?: number | string;
}

const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  title,
  helper,
  icon,
  accentClass,
  routerLink,
  loading = false,
  value,
}) => {
  const clickableProps = routerLink ? { routerLink, button: true } : {};

  return (
    <IonCard className={`dashboard-stat-card ${accentClass}`} {...clickableProps}>
      <IonCardContent>
        <div className="dashboard-stat-head">
          <div className="dashboard-stat-copy">
            <span className="dashboard-stat-title">{title}</span>
            {helper ? <span className="dashboard-stat-helper">{helper}</span> : null}
          </div>
          <div className="dashboard-stat-icon-wrap">
            <IonIcon icon={icon} className="dashboard-stat-icon" />
          </div>
        </div>

        <div className="dashboard-stat-value">
          {loading ? (
            <IonSpinner name="crescent" />
          ) : typeof value === "number" ? (
            value.toLocaleString()
          ) : (
            value || ""
          )}
        </div>

        {routerLink ? (
          <IonBadge className="dashboard-stat-badge" color="light">
            View
          </IonBadge>
        ) : null}
      </IonCardContent>
    </IonCard>
  );
};

export default DashboardStatCard;
