import {
  IonBadge,
  IonCardHeader,
  IonCardTitle,
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
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonSpinner,
  useIonViewWillEnter,
} from "@ionic/react";
import {
  arrowBack,
  cashOutline,
  schoolOutline,
  listOutline,
  peopleOutline,
  pieChartOutline,
} from "ionicons/icons";
import { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { apiGet } from "../services/api";
import { useLocalInfiniteScroll } from "../hooks/useLocalInfiniteScroll";
import "./Groups.css";

type GroupRow = {
  groupID: string;
  groupname: string;
};

const Group: React.FC = () => {
  const history = useHistory();
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [loadingGroups, setLoadingGroups] = useState<boolean>(true);
  const [selectedGroup, setSelectedGroup] = useState<GroupRow | null>(null);

  // Dashboard menu items
  const menuItems = [
    {
      label: "Beneficiaries",
      icon: peopleOutline,
      route: "/groups/beneficiaries",
    },
    { label: "Group Savings", icon: cashOutline, route: "/groups/savings" },
    { label: "Trainings", icon: schoolOutline, route: "/groups/trainings" },
    {
      label: "Meetings & Attendance",
      icon: listOutline,
      route: "/groups/attendance",
    },
    { label: "Group IGA", icon: pieChartOutline, route: "/groups/group-iga" },
  ];

  const {
    visible: visibleGroups,
    loadMore,
    resetKey,
  } = useLocalInfiniteScroll<GroupRow>({
    items: groups,
    pageSize: 20,
  });

  const loadGroups = useCallback(async () => {
    setLoadingGroups(true);

    try {
      const rows = await apiGet<GroupRow[]>("/groups");
      setGroups(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error("Failed to load groups:", error);
      setGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingGroups(true);
      try {
        const rows = await apiGet<GroupRow[]>("/groups");
        if (!cancelled) {
          setGroups(Array.isArray(rows) ? rows : []);
        }
      } catch (error) {
        console.error("Failed to load groups:", error);
        if (!cancelled) setGroups([]);
      } finally {
        if (!cancelled) setLoadingGroups(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useIonViewWillEnter(() => {
    loadGroups();
  });

  const handleSelectGroup = (group: GroupRow) => {
    setSelectedGroup(group);
    localStorage.setItem("selectedGroupID", group.groupID);
    localStorage.setItem("selectedGroupName", group.groupname || "");
  };

  const showGroupMenu = selectedGroup !== null;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonButtons slot="start">
            <IonButton
              onClick={() => {
                if (showGroupMenu) {
                  setSelectedGroup(null);
                  return;
                }
                history.goBack();
              }}
              color="light"
            >
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle className="white-title">
            {showGroupMenu ? "Group" : "Select Group"}
          </IonTitle>
          {showGroupMenu && selectedGroup && (
            <IonButtons slot="end">
              <IonButton onClick={() => setSelectedGroup(null)} color="light">
                Change
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {!showGroupMenu ? (
          <>
            {loadingGroups ? (
              <div className="groups-loading">
                <IonSpinner name="crescent" />
              </div>
            ) : groups.length === 0 ? (
              <IonBadge color="medium">No groups found</IonBadge>
            ) : (
              <IonCard className="groups-list-card">
                <IonCardHeader>
                  <IonCardTitle>Groups</IonCardTitle>
                </IonCardHeader>

                <IonCardContent>
                  <IonList>
                    {visibleGroups.map((group) => (
                      <IonItem
                        key={group.groupID}
                        button
                        detail
                        onClick={() => handleSelectGroup(group)}
                      >
                        <IonLabel>
                          <h2>{group.groupname || "Unnamed Group"}</h2>
                          <p>{group.groupID}</p>
                        </IonLabel>
                      </IonItem>
                    ))}
                  </IonList>

                  <IonInfiniteScroll
                    key={resetKey}
                    threshold="100px"
                    onIonInfinite={loadMore}
                  >
                    <IonInfiniteScrollContent
                      loadingSpinner="crescent"
                      loadingText="Loading more groups..."
                    />
                  </IonInfiniteScroll>
                </IonCardContent>
              </IonCard>
            )}
          </>
        ) : (
          <>
            <IonCard className="selected-group-card">
              <IonCardContent>
                <IonLabel>
                  <h2>{selectedGroup?.groupname}</h2>
                  <p>{selectedGroup?.groupID}</p>
                </IonLabel>
              </IonCardContent>
            </IonCard>

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
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Group;
