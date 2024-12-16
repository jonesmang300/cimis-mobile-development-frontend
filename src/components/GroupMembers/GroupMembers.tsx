import React from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonFab,
  IonFabButton,
  IonAvatar,
  IonButtons,
} from "@ionic/react";
import { add, menu, search, peopleOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useMembers } from "../context/MembersContext"; // Import the custom hook

const GroupMembers: React.FC = () => {
  const history = useHistory();
  const { members } = useMembers(); // Use the context

  const handleMeetingsClick = () => {
    history.push("/meetings");
  };

  const handleAddMember = () => {
    history.push("add-member")
  }

  if (!members.length) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Members</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p>Loading...</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Members</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleMeetingsClick}>
              <IonIcon icon={peopleOutline} />
            </IonButton>
            <IonButton>
              <IonIcon icon={search} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonList>
          {members.map((member, index) => (
            <IonItem key={index} button>
              <IonAvatar slot="start">
                <div
                  style={{
                    backgroundColor: "#4CAF50",
                    color: "#fff",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontWeight: "bold",
                  }}
                >
                  {member.firstName[0]}{member.lastName[0]}
                </div>
              </IonAvatar>
              <IonLabel>
                <h2>{member.firstName} {member.lastName}</h2>
                <p>{member.village}</p>
              </IonLabel>
              <IonButton fill="clear" slot="end">
                <IonIcon icon={menu} />
              </IonButton>
            </IonItem>
          ))}
        </IonList>

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton  color="success" onClick={handleAddMember}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default GroupMembers;
