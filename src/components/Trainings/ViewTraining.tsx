import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonCardSubtitle,
  IonSpinner,
  IonText,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonBadge,
} from "@ionic/react";
import { create, personAdd } from "ionicons/icons";
import { useHistory } from "react-router";
import { getData } from "../../services/apiServices";
import { useTrainings } from "../context/TrainingsContext";
import { useClusters } from "../context/ClustersContext";
import { useAttendance } from "../context/AttendanceContext";
import { formatDate } from "../../utils/FormatDate";

const ViewTraining: React.FC = () => {
  const {
    trainings,
    returnTrainings,
    selectedTraining,
    setTheSelectedTraining,
  } = useTrainings();
  const { selectedCluster } = useClusters();
  const { returnAttendances, attendances } = useAttendance();

  const [trainingTypes, setTrainingTypes] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [tas, setTas] = useState<any[]>([]);
  const [facilitators, setFacilitators] = useState<any[]>([]);
  const [displayedTrainings, setDisplayedTrainings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState<number>(10);

  const history = useHistory();

  // ✅ Fetch all required data
  useEffect(() => {
    if (!selectedCluster?.ClusterID) return; // wait for cluster to exist

    const fetchAllData = async () => {
      setLoading(true);
      setError(null);

      try {
        const encodedClusterID = encodeURIComponent(selectedCluster.ClusterID);

        const [
          trainingsRes,
          typesRes,
          regionsRes,
          districtsRes,
          tasRes,
          facilitatorsRes,
          memberTrainingsRes,
        ] = await Promise.all([
          getData("/api/trainings"),
          getData("/api/training-types"),
          getData("/api/region"),
          getData("/api/district"),
          getData("/api/ta"),
          getData("/api/training-facilitators"),
          getData(`/api/cluster-member-trainings/${encodedClusterID}`),
        ]);

        const trainingData = Array.isArray(trainingsRes)
          ? trainingsRes
          : trainingsRes.data || [];
        const trainingTypeData = Array.isArray(typesRes)
          ? typesRes
          : typesRes.data || [];
        const regionsData = Array.isArray(regionsRes)
          ? regionsRes
          : regionsRes.data || [];
        const districtsData = Array.isArray(districtsRes)
          ? districtsRes
          : districtsRes.data || [];
        const tasData = Array.isArray(tasRes) ? tasRes : tasRes.data || [];
        const facilitatorsData = Array.isArray(facilitatorsRes)
          ? facilitatorsRes
          : facilitatorsRes.data || [];
        const memberTrainingsData = Array.isArray(memberTrainingsRes)
          ? memberTrainingsRes
          : memberTrainingsRes.data || [];

        returnTrainings(trainingData);
        setTrainingTypes(trainingTypeData);
        setRegions(regionsData);
        setDistricts(districtsData);
        setTas(tasData);
        setFacilitators(facilitatorsData);
        returnAttendances(memberTrainingsData);
        setDisplayedTrainings(trainingData.slice(0, visibleCount));
      } catch (err: any) {
        console.error("Error fetching training data:", err);
        setError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [selectedCluster]);

  // ✅ Infinite scroll
  const loadMore = (ev: CustomEvent<void>) => {
    setTimeout(() => {
      const newCount = visibleCount + 10;
      setDisplayedTrainings(trainings.slice(0, newCount));
      setVisibleCount(newCount);
      (ev.target as HTMLIonInfiniteScrollElement).complete();
    }, 500);
  };

  // ✅ Filter by search
  const filteredTrainings = displayedTrainings.filter((t) => {
    const query = searchQuery.toLowerCase();
    return (
      t.TrainingName?.toLowerCase().includes(query) ||
      t.Region?.toLowerCase().includes(query) ||
      t.District?.toLowerCase().includes(query)
    );
  });

  // ✅ Find current training and related data
  const training =
    trainings.find((t) => t.TrainingID === selectedTraining?.TrainingID) ||
    selectedTraining;

  const trainingType = trainingTypes.find(
    (type) => type.trainingTypeID === training?.TrainingTypeID
  );

  const region = regions.find(
    (r: any) => r.regionID === training?.regionID
  )?.name;

  const district = districts.find(
    (d: any) => d.DistrictID === training?.districtID
  )?.DistrictName;

  const ta = tas.find((t: any) => t.TAID === selectedCluster?.taID)?.TAName;

  const facilitator = facilitators.find(
    (f: any) => f.facilitatorID === training?.trainedBy
  )?.title;

  // ✅ Handlers
  const handleEditTraining = (training: any) => {
    setTheSelectedTraining(training);
    history.push(`/edit-training`);
  };

  const handleAddAttendance = (training: any) => {
    setTheSelectedTraining(training);
    history.push(`/attendance`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Training Details</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {loading && (
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <IonSpinner name="crescent" />
            <IonText> Loading training...</IonText>
          </div>
        )}

        {error && (
          <IonText color="danger">
            <p style={{ textAlign: "center" }}>{error}</p>
          </IonText>
        )}

        {/* ✅ Training Details Card */}
        {training && (
          <IonCard>
            <IonCardContent>
              <IonCardSubtitle>
                <strong>Training Type:</strong>{" "}
                {trainingType?.training_name || "-"}
              </IonCardSubtitle>

              <IonText>
                <p>
                  <strong>Region:</strong> {region || "-"}
                </p>
                <p>
                  <strong>District:</strong> {district || "-"}
                </p>
                <p>
                  <strong>TA:</strong> {ta || "-"}
                </p>
                <p>
                  <strong>Cluster:</strong>{" "}
                  {selectedCluster?.ClusterName || "-"}
                </p>
                <p>
                  <strong>Start Date:</strong> {formatDate(training.StartDate)}
                </p>
                <p>
                  <strong>Finish Date:</strong>{" "}
                  {formatDate(training.FinishDate)}
                </p>
                <p>
                  <strong>Males Trained:</strong> {training.Males || 0}
                </p>
                <p>
                  <strong>Females Trained:</strong> {training.Females || 0}
                </p>
                <p>
                  <strong>Total Trained:</strong>{" "}
                  {training.Males + training.Females || 0}
                </p>
                <p>
                  <strong>Facilitator:</strong> {facilitator || "-"}
                </p>
              </IonText>

              <IonButton
                expand="block"
                color="primary"
                onClick={() => handleEditTraining(training)}
              >
                <IonIcon icon={create} slot="start" /> Edit Training
              </IonButton>

              <IonButton
                expand="block"
                color="success"
                onClick={() => handleAddAttendance(training)}
              >
                <IonIcon icon={personAdd} slot="start" /> Add Attendance
              </IonButton>
            </IonCardContent>
          </IonCard>
        )}

        {/* ✅ Attendances */}
        {attendances.length === 0 && !loading && (
          <IonText
            color="medium"
            style={{ textAlign: "center", marginTop: "20px" }}
          >
            No attendance records found.
          </IonText>
        )}

        {attendances.map((attendance: any, index: number) => (
          <IonCard
            key={attendance.hh_code + index}
            style={{ marginBottom: "15px" }}
          >
            <IonCardContent>
              <IonItem lines="none">
                <IonBadge
                  slot="start"
                  color="primary"
                  style={{
                    borderRadius: "50%",
                    minWidth: "28px",
                    height: "28px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {index + 1}
                </IonBadge>
                <IonLabel>
                  <h2>{attendance.hh_head_name || "No Name"}</h2>
                  <p>
                    <strong>Household Code:</strong> {attendance.hh_code || "-"}
                  </p>
                  <p>
                    <strong>Cluster:</strong> {attendance.clusterName || "-"}
                  </p>
                  <p>
                    <strong>Training Type:</strong>{" "}
                    {attendance.trainingType || "-"}
                  </p>
                  <p>
                    <strong>Start Date:</strong>{" "}
                    {formatDate(attendance.startDate) || "-"}
                  </p>
                  <p>
                    <strong>Finish Date:</strong>{" "}
                    {formatDate(attendance.finishDate) || "-"}
                  </p>
                  <p>
                    <strong>Trained By:</strong> {attendance.trainedBy || "-"}
                  </p>
                  <p>
                    <strong>Attended:</strong>{" "}
                    {attendance.attended ? "Yes" : "No"}
                  </p>
                </IonLabel>
              </IonItem>
            </IonCardContent>
          </IonCard>
        ))}

        <IonInfiniteScroll onIonInfinite={loadMore}>
          <IonInfiniteScrollContent
            loadingSpinner="bubbles"
            loadingText="Loading more trainings..."
          />
        </IonInfiniteScroll>
      </IonContent>
    </IonPage>
  );
};

export default ViewTraining;
