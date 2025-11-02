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

  // ✅ Fetch Traditional Authorities
  const fetchTAs = useCallback(async () => {
    try {
      const taResult = await getData("/api/ta");
      setTAs(Array.isArray(taResult) ? taResult : taResult.data || []);
    } catch (err) {
      console.error("Failed to fetch TAs:", err);
      setError("Failed to fetch TAs");
    }
  }, []);

  // ✅ Fetch Districts
  const fetchDistricts = useCallback(async () => {
    try {
      const districtResult = await getData("/api/district");
      setDistricts(
        Array.isArray(districtResult)
          ? districtResult
          : districtResult.data || []
      );
    } catch (err) {
      console.error("Failed to fetch Districts:", err);
      setError("Failed to fetch Districts");
    }
  }, []);

  // ✅ Fetch Regions
  const fetchRegions = useCallback(async () => {
    try {
      const regionResult = await getData("/api/region");
      setRegions(
        Array.isArray(regionResult) ? regionResult : regionResult.data || []
      );
    } catch (err) {
      console.error("Failed to fetch Regions:", err);
      setError("Failed to fetch Regions");
    }
  }, []);

  // ✅ Fetch Projects (corrected)
  const fetchProjects = useCallback(async () => {
    try {
      const projectResult = await getData("/api/project");
      setProjects(
        Array.isArray(projectResult) ? projectResult : projectResult.data || []
      );
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setError("Failed to fetch projects");
    }
  }, []);

  // ✅ Fetch Programs (corrected)
  const fetchPrograms = useCallback(async () => {
    try {
      const programResult = await getData("/api/program");
      setPrograms(
        Array.isArray(programResult) ? programResult : programResult.data || []
      );
    } catch (err) {
      console.error("Failed to fetch programs:", err);
      setError("Failed to fetch programs");
    }
  }, []);

  // ✅ Run all fetches
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchTAs(),
        fetchDistricts(),
        fetchRegions(),
        fetchProjects(),
        fetchPrograms(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchTAs, fetchDistricts, fetchRegions, fetchProjects, fetchPrograms]);

  // ✅ Mappings (corrected)
  const ta =
    tas.find((t: any) => t.TAID === selectedGroup?.TAID)?.TAName || "-";

  const district =
    districts.find((d: any) => d.DistrictID === selectedGroup?.DistrictID)
      ?.DistrictName || "-";

  const region =
    regions.find((r: any) => r.regionID === selectedGroup?.regionID)?.name ||
    "-";

  const project =
    projects.find((p: any) => p.projID === selectedGroup?.projectID)
      ?.projName || "-";

  const program =
    programs.find((pg: any) => pg.pID === selectedGroup?.programID)?.pName ||
    "-";

  // ✅ Loading State
  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>View Group</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent
          className="ion-padding ion-text-center ion-align-items-center ion-justify-content-center"
          fullscreen
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: "12px",
            }}
          >
            <IonSpinner name="crescent" color="primary" />
            <p style={{ fontSize: "1.1rem", color: "#555" }}>Loading...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // ✅ Error State
  if (error) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>View Group</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding ion-text-center">
          <p style={{ color: "red" }}>{error}</p>
        </IonContent>
      </IonPage>
    );
  }

  // ✅ Main View
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
                    <strong>GVH:</strong> {selectedGroup?.gvhID || "-"}
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
                    <strong>Project:</strong> {project}
                  </IonLabel>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol>
                  <IonLabel>
                    <strong>Program:</strong> {program || "-"}
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
