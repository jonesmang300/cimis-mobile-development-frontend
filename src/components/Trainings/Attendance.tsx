import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonSpinner,
  IonToggle,
  IonBadge,
  IonButtons,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonToast,
  useIonRouter,
} from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import { getData, postData } from "../../services/apiServices";
import { useClusters } from "../context/ClustersContext";
import { useTrainings } from "../context/TrainingsContext";
import { formatDate } from "../../utils/FormatDate";
import { useAttendance } from "../context/AttendanceContext";
import { useHistory } from "react-router";

const Attendance: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [displayedMembers, setDisplayedMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState<number>(20);
  const [allSelected, setAllSelected] = useState<boolean>(false);
  const [clusterDetails, setClusterDetails] = useState<any>(null);
  const [trainingTypes, setTrainingTypes] = useState<any[]>([]);
  const [facilitators, setFacilitators] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [disableInfiniteScroll, setDisableInfiniteScroll] =
    useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const { selectedCluster } = useClusters();
  const { selectedTraining } = useTrainings();
  const { addAttendance } = useAttendance();
  const router = useIonRouter(); // ✅ Ionic navigation
  const history = useHistory();

  const clusterID = selectedCluster?.ClusterID;
  const encodedClusterID = encodeURIComponent(clusterID || "");

  // Fetch lookup data
  const fetchLookups = async () => {
    try {
      const [typesRes, facilitatorsRes] = await Promise.all([
        getData("/api/training-types"),
        getData("/api/training-facilitators"),
      ]);

      setTrainingTypes(
        Array.isArray(typesRes) ? typesRes : typesRes.data || []
      );
      setFacilitators(
        Array.isArray(facilitatorsRes)
          ? facilitatorsRes
          : facilitatorsRes.data || []
      );
    } catch (err) {
      console.error("Failed to fetch lookup data", err);
    }
  };

  // Fetch cluster members
  const fetchMembers = async () => {
    if (!encodedClusterID) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getData(`/api/clustermembers/${encodedClusterID}`);
      const data = Array.isArray(res) ? res : res.data || [];
      setMembers(data);
      setDisplayedMembers(data.slice(0, visibleCount));
      setDisableInfiniteScroll(data.length <= visibleCount);

      if (selectedCluster) {
        const trainingTypeName =
          trainingTypes.find((t) => t.id === selectedCluster.TrainingType)
            ?.name || "-";
        const facilitatorName =
          facilitators.find((f) => f.id === selectedCluster.Facilitator)
            ?.name || "-";

        setClusterDetails({
          clusterName: selectedCluster.ClusterName,
          trainingType: trainingTypeName,
          startDate: selectedTraining?.StartDate || "-",
          finishDate: selectedTraining?.FinishDate || "-",
          facilitator: facilitatorName,
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [encodedClusterID]);

  // Search filter
  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = members.filter(
      (m: any) =>
        m.hh_code?.toLowerCase().includes(query) ||
        m.hh_head_name?.toLowerCase().includes(query)
    );
    setDisplayedMembers(filtered.slice(0, visibleCount));
    setDisableInfiniteScroll(filtered.length <= visibleCount);
  }, [searchQuery, members, visibleCount]);

  // Infinite scroll
  const loadMore = async (ev: CustomEvent<void>) => {
    setTimeout(() => {
      const newCount = visibleCount + 20;
      const query = searchQuery.toLowerCase();
      const filtered = members.filter(
        (m: any) =>
          m.hh_code?.toLowerCase().includes(query) ||
          m.hh_head_name?.toLowerCase().includes(query)
      );

      if (newCount >= filtered.length) {
        setDisplayedMembers(filtered);
        setDisableInfiniteScroll(true);
      } else {
        setDisplayedMembers(filtered.slice(0, newCount));
        setVisibleCount(newCount);
      }

      (ev.target as HTMLIonInfiniteScrollElement).complete();
    }, 500);
  };

  // Toggle individual attendance
  const handleToggle = (index: number) => {
    setDisplayedMembers((prev) =>
      prev.map((member, i) =>
        i === index ? { ...member, attended: !member.attended } : member
      )
    );
  };

  // Toggle select all
  const handleSelectAll = () => {
    const newAllSelected = !allSelected;
    setAllSelected(newAllSelected);
    setDisplayedMembers((prev) =>
      prev.map((member) => ({ ...member, attended: newAllSelected }))
    );
  };

  // Submit attendance
  const submitAttendance = async () => {
    if (!clusterID || !selectedTraining) return;

    const selectedMembers = displayedMembers.filter((m) => m.attended);
    if (selectedMembers.length === 0) {
      setToastMessage("No members selected for attendance.");
      return;
    }

    setSubmitting(true);

    try {
      for (const m of selectedMembers) {
        const payload = {
          ClusterID: clusterID,
          sppCode: m.sppCode || m.hh_code,
          TrainingID: selectedTraining.TrainingID,
          StartDate: selectedTraining.StartDate,
          FinishDate: selectedTraining.FinishDate,
          trainedBy: selectedTraining.trainedBy || "01",
          attendance: "1",
        };
        await postData("/api/member-trainings", payload);
      }

      addAttendance(selectedMembers);
      setToastMessage("Attendance submitted successfully!");

      // Delay redirect slightly to allow toast to show
      history.push("/view-training");

      // Reset toggles
      setDisplayedMembers((prev) =>
        prev.map((member) => ({ ...member, attended: false }))
      );
      setAllSelected(false);
    } catch (err: any) {
      console.error(err);
      setToastMessage("Failed to submit attendance.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => router.goBack()}>
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>Training Attendance</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding" scrollEvents={true}>
        {loading && (
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <IonSpinner name="crescent" />
            <IonText> Loading cluster members...</IonText>
          </div>
        )}

        {error && (
          <IonText color="danger">
            <p style={{ textAlign: "center" }}>{error}</p>
          </IonText>
        )}

        {!loading && !error && (
          <>
            {clusterDetails && (
              <IonCard style={{ marginBottom: "20px" }}>
                <IonCardContent>
                  <IonText>
                    <p>
                      <strong>Cluster Name:</strong>{" "}
                      {clusterDetails.clusterName}
                    </p>
                    <p>
                      <strong>Training Type:</strong>{" "}
                      {clusterDetails.trainingType}
                    </p>
                    <p>
                      <strong>Start Date:</strong>{" "}
                      {formatDate(clusterDetails.startDate)}
                    </p>
                    <p>
                      <strong>Finish Date:</strong>{" "}
                      {formatDate(clusterDetails.finishDate)}
                    </p>
                    <p>
                      <strong>Facilitator:</strong> {clusterDetails.facilitator}
                    </p>
                  </IonText>
                </IonCardContent>
              </IonCard>
            )}

            <div style={{ position: "sticky", top: 0, zIndex: 10 }}>
              <IonSearchbar
                value={searchQuery}
                onIonInput={(e) => setSearchQuery(e.detail.value!)}
                debounce={300}
                placeholder="Search household..."
                animated
              />
            </div>

            {displayedMembers.length === 0 ? (
              <IonText color="medium">
                <p style={{ textAlign: "center", marginTop: "20px" }}>
                  No members found.
                </p>
              </IonText>
            ) : (
              <IonCard>
                <IonCardContent>
                  <IonList inset lines="none">
                    <IonItem>
                      <IonLabel>
                        <strong>Select All</strong>
                      </IonLabel>
                      <IonToggle
                        checked={allSelected}
                        onIonChange={handleSelectAll}
                        color="success"
                        slot="end"
                      />
                    </IonItem>

                    {displayedMembers.map((member, index) => (
                      <IonItem key={`${member.hh_code || "member"}-${index}`}>
                        <IonBadge
                          slot="start"
                          color="success"
                          style={{
                            borderRadius: "50%",
                            minWidth: "28px",
                            height: "28px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            fontSize: "14px",
                          }}
                        >
                          {index + 1}
                        </IonBadge>

                        <IonLabel>
                          <h2 style={{ fontWeight: 600, fontSize: "1rem" }}>
                            {member.hh_head_name || "No Name"}
                          </h2>
                          <IonText color="medium">
                            <p style={{ margin: 0, fontSize: "0.9rem" }}>
                              <strong>Code:</strong> {member.hh_code || "-"}
                            </p>
                          </IonText>
                        </IonLabel>

                        <IonToggle
                          checked={member.attended || false}
                          onIonChange={() => handleToggle(index)}
                          color="success"
                          slot="end"
                        />
                      </IonItem>
                    ))}
                  </IonList>

                  <IonButton
                    expand="block"
                    color="success"
                    onClick={submitAttendance}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <IonSpinner
                          name="crescent"
                          style={{ marginRight: "8px" }}
                        />
                        Submitting...
                      </>
                    ) : (
                      "Submit Attendance"
                    )}
                  </IonButton>

                  {!disableInfiniteScroll && (
                    <IonInfiniteScroll
                      threshold="100px"
                      onIonInfinite={loadMore}
                      disabled={disableInfiniteScroll}
                    >
                      <IonInfiniteScrollContent
                        loadingSpinner="bubbles"
                        loadingText="Loading more members..."
                      />
                    </IonInfiniteScroll>
                  )}
                </IonCardContent>
              </IonCard>
            )}
          </>
        )}

        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage}
          duration={5000}
          onDidDismiss={() => setToastMessage("")}
          color={toastMessage.includes("Failed") ? "danger" : "success"}
        />
      </IonContent>
    </IonPage>
  );
};

export default Attendance;
