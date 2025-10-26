import React, { useEffect, useState, useCallback } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol,
  IonLabel,
} from "@ionic/react";
import { arrowBackOutline, peopleOutline, search } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useMembers } from "../context/MembersContext";
import { useClusters } from "../context/ClustersContext";
import { useGroups } from "../context/GroupsContext";
import { useNotificationMessage } from "../context/notificationMessageContext";
import { NotificationMessage } from "../notificationMessage";
import { getData } from "../../services/apiServices";

const ViewGroup: React.FC = () => {
  const history = useHistory();
  const { returnMembers, selectedMember } = useMembers();
  const { selectedCluster } = useClusters();
  const { selectedGroup } = useGroups();
  const { messageState } = useNotificationMessage();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tas, setTAs] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);

  const fetchTAs = useCallback(async () => {
    setLoading(true);
    try {
      const taResult = await getData("/api/ta");
      if (Array.isArray(taResult)) {
        setTAs(taResult);
      } else if (taResult.data) {
        setTAs(taResult.data);
      } else {
        setTAs([]);
      }
    } catch (err) {
      console.error("Failed to fetch TAs:", err);
      setError("Failed to fetch TAs");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDistricts = useCallback(async () => {
    setLoading(true);
    try {
      const districtResult = await getData("/api/district");
      if (Array.isArray(districtResult)) {
        setDistricts(districtResult);
      } else if (districtResult.data) {
        setDistricts(districtResult.data);
      } else {
        setDistricts([]);
      }
    } catch (err) {
      console.error("Failed to fetch Districts:", err);
      setError("Failed to fetch Districts");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRegions = useCallback(async () => {
    setLoading(true);
    try {
      const regionResult = await getData("/api/region");
      if (Array.isArray(regionResult)) {
        setRegions(regionResult);
      } else if (regionResult.data) {
        setRegions(regionResult.data);
      } else {
        setRegions([]);
      }
    } catch (err) {
      console.error("Failed to fetch Regions:", err);
      setError("Failed to fetch Regions");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const projectResult = await getData("/api/project");
      if (Array.isArray(projectResult)) {
        setRegions(projectResult);
      } else if (projectResult.data) {
        setRegions(projectResult.data);
      } else {
        setProjects([]);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setError("Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const programResult = await getData("/api/program");
      if (Array.isArray(programResult)) {
        setRegions(programResult);
      } else if (programResult.data) {
        setRegions(programResult.data);
      } else {
        setPrograms([]);
      }
    } catch (err) {
      console.error("Failed to fetch programs:", err);
      setError("Failed to fetch programs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTAs();
    fetchDistricts();
    fetchRegions();
    fetchProjects();
    fetchPrograms();
  }, []);

  const ta =
    tas.find((t: any) => t.TAID === selectedCluster.taID)?.TAName || "-";

  const district =
    districts.find((d: any) => d.DistrictID === selectedCluster?.districtID)
      ?.DistrictName || "-";

  const region =
    regions.find((r: any) => r.regionID === selectedCluster.regionID)?.name ||
    "-";

  const project =
    projects.find((p: any) => p.regionID === selectedCluster.projectID)
      ?.projName || "-";

  const program =
    regions.find((pg: any) => pg.pID === selectedCluster.programID)?.pName ||
    "-";

  // if (loading) {
  //   return (
  //     <IonPage>
  //       <IonHeader>
  //         <IonToolbar>
  //           <IonTitle>View Member</IonTitle>
  //         </IonToolbar>
  //       </IonHeader>
  //       <IonContent className="ion-padding" style={{ textAlign: "center" }}>
  //         <IonSpinner name="crescent" />
  //         <p>Loading...</p>
  //       </IonContent>
  //     </IonPage>
  //   );
  // }

  if (error) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>View Group</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding" style={{ textAlign: "center" }}>
          <p>{error}</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => history.push("/groups")}>
              <IonIcon icon={arrowBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>View Group</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push("/groups")}>
              <IonIcon icon={peopleOutline} />
            </IonButton>
            <IonButton>
              <IonIcon icon={search} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {messageState.type === "success" && (
          <NotificationMessage
            text={messageState.text}
            type={messageState.type}
          />
        )}

        {/* Identification Information */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Identification Information</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonGrid>
              <IonRow>
                <IonCol>
                  <IonLabel>
                    <strong>Region:</strong> {region}
                  </IonLabel>
                </IonCol>
                <IonCol>
                  <IonLabel>
                    <strong>District:</strong> {district}
                  </IonLabel>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonLabel>
                    <strong>TA:</strong> {ta}
                  </IonLabel>
                </IonCol>
                <IonCol>
                  <IonLabel>
                    <strong>GVH:</strong> {selectedCluster?.gvhID || "-"}
                  </IonLabel>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonLabel>
                    <strong>Village:</strong> {selectedGroup?.village || "-"}
                  </IonLabel>
                </IonCol>

                <IonCol>
                  <IonLabel>
                    <strong>Village:</strong> {project || "-"}
                  </IonLabel>
                </IonCol>

                <IonCol>
                  <IonLabel>
                    <strong>Village:</strong> {program || "-"}
                  </IonLabel>
                </IonCol>

                <IonCol>
                  <IonLabel>
                    <strong>Cluster:</strong>{" "}
                    {selectedCluster?.ClusterName || "-"}
                  </IonLabel>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonLabel>
                    <strong>Group:</strong> {selectedGroup?.groupname || "-"}
                  </IonLabel>
                </IonCol>
                <IonCol>
                  <IonLabel>
                    <strong>Catchment:</strong>{" "}
                    {selectedGroup?.catchment || "-"}
                  </IonLabel>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default ViewGroup;
