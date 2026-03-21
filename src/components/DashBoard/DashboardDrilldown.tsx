import React from "react";
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { arrowForward, refresh, trendingUp } from "ionicons/icons";
import { useHistory } from "react-router";

type MetricKey =
  | "verified"
  | "groups"
  | "trainings"
  | "meetings"
  | "savings"
  | "groupIGAs"
  | "memberIGAs"
  | "myVerified";

export type DrilldownMetric = {
  key: MetricKey;
  title: string;
  value: number;
  helper: string;
};

const routeMap: Record<MetricKey, string> = {
  verified: "/verified_members",
  myVerified: "/verified_members_by_device",
  groups: "/groups?metric=all",
  trainings: "/groups?metric=trainings",
  meetings: "/groups?metric=meetings",
  savings: "/groups?metric=savings",
  groupIGAs: "/groups?metric=group-igas",
  memberIGAs: "/groups?metric=member-igas",
};

interface Props {
  metric: DrilldownMetric;
  onClose: () => void;
}

const DashboardDrilldown: React.FC<Props> = ({ metric, onClose }) => {
  const history = useHistory();

  const goToFull = () => {
    const route = routeMap[metric.key];
    if (route) {
      history.push(route);
      onClose();
    }
  };

  return (
    <>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>{metric.title}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, color: "#6b7280" }}>{metric.helper}</div>
            <div style={{ fontSize: 32, fontWeight: 800, marginTop: 4 }}>
              {metric.value.toLocaleString()}
            </div>
          </div>
          <IonButton fill="clear" onClick={onClose}>
            Close
          </IonButton>
        </div>

        <IonList lines="none">
          <IonItem>
            <IonIcon slot="start" icon={trendingUp} />
            <IonLabel>
              <h3>Trend</h3>
              <p>Pull to refresh dashboard to update this metric.</p>
            </IonLabel>
            <IonButton slot="end" fill="clear" onClick={onClose}>
              Ok
            </IonButton>
          </IonItem>

          <IonItem button detail onClick={goToFull}>
            <IonIcon slot="start" icon={arrowForward} />
            <IonLabel>
              <h3>Open full view</h3>
              <p>Go to the detailed screen for this metric.</p>
            </IonLabel>
          </IonItem>

          <IonItem button detail onClick={onClose}>
            <IonIcon slot="start" icon={refresh} />
            <IonLabel>
              <h3>Dismiss</h3>
              <p>Close this panel.</p>
            </IonLabel>
          </IonItem>
        </IonList>
      </IonContent>
    </>
  );
};

export default DashboardDrilldown;
