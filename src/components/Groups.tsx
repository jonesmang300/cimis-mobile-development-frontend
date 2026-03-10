import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonTitle,
  IonContent,
  IonList,
  IonCard,
  IonCardContent,
  IonLabel,
} from "@ionic/react";
import {
  arrowBack,
  cashOutline,
  schoolOutline,
  listOutline,
  peopleOutline,
  pieChartOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import "./Groups.css";

const Group: React.FC = () => {
  const history = useHistory();

  // Dashboard menu items
  const menuItems = [
    { label: "Savings", icon: cashOutline, route: "/groups/savings" },
    { label: "Trainings", icon: schoolOutline, route: "/groups/trainings" },
    { label: "Attendance Register", icon: listOutline, route: "/groups/attendance" },
    { label: "Member IGA", icon: peopleOutline, route: "/groups/member-iga" },
    { label: "Group IGA", icon: pieChartOutline, route: "/groups/group-iga" },
  ];

  return (
    <IonPage>
      {/* Header */}
      <IonHeader>
        <IonToolbar color="success">
          <IonButtons slot="start">
            <IonButton onClick={() => history.goBack()} color="light">
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle className="white-title">Groups</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* Content */}
      <IonContent className="ion-padding">
        <IonList>
          {menuItems.map((item) => (
            <IonCard
              key={item.label}
              button
              onClick={() => history.push(item.route)}
              className="group-card"
            >
              <IonCardContent className="group-card-content">
                <IonIcon icon={item.icon} className="group-card-icon" />
                <IonLabel>{item.label}</IonLabel>
              </IonCardContent>
            </IonCard>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Group;