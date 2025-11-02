import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonSpinner,
  IonText,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from "@ionic/react";
import { add, eye } from "ionicons/icons";
import { useHistory } from "react-router";
import { getData } from "../../services/apiServices";
import { useTrainings } from "../context/TrainingsContext";
import { useClusters } from "../context/ClustersContext";

const Trainings: React.FC = () => {
  const { trainings, returnTrainings, setTheSelectedTraining } = useTrainings();
  const { selectedCluster } = useClusters();

  const [trainingTypes, setTrainingTypes] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const history = useHistory();

  // ✅ Fetch trainings and training types
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [trainingsRes, typesRes] = await Promise.all([
          getData("/api/trainings"),
          getData("/api/training-types"),
        ]);

        const trainingData = Array.isArray(trainingsRes)
          ? trainingsRes
          : trainingsRes.data || [];

        const trainingTypeData = Array.isArray(typesRes)
          ? typesRes
          : typesRes.data || [];

        returnTrainings(trainingData);
        setTrainingTypes(trainingTypeData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // ✅ Filter by selected cluster
  const filteredByCluster = trainings.filter(
    (t: any) => t?.groupID === selectedCluster?.ClusterID
  );

  // ✅ Search filter
  const filteredTrainings = filteredByCluster.filter((t: any) =>
    (t.TrainingName || t.name || "")
      .toString()
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  // ✅ Infinite scroll
  const loadMore = (e: CustomEvent<void>) => {
    setTimeout(() => {
      setVisibleCount((prev) => prev + 10);
      (e.target as HTMLIonInfiniteScrollElement).complete();
    }, 600);
  };

  const handleAddTraining = () => history.push("/add-training");

  const handleView = (training: any) => {
    setTheSelectedTraining(training);
    history.push("/view-training");
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Trainings</IonTitle>
          <IonButtons slot="end">
            {/* <IonButton onClick={handleAddTraining}>
              <IonIcon icon={add} />
            </IonButton> */}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* ✅ Add Training Button (Visible at top) */}
        <div style={{ textAlign: "left", marginBottom: "10px" }}>
          <IonButton color="success" onClick={handleAddTraining}>
            <IonIcon icon={add} slot="start" />
            Add Training
          </IonButton>
        </div>

        {/* ✅ Loading state */}
        {loading && (
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <IonSpinner name="crescent" />
            <IonText> Loading trainings...</IonText>
          </div>
        )}

        {/* ✅ Error state */}
        {error && (
          <IonText color="danger">
            <p style={{ textAlign: "center" }}>{error}</p>
          </IonText>
        )}

        {/* ✅ Trainings List */}
        {!loading && !error && filteredTrainings.length > 0 && (
          <>
            <IonSearchbar
              value={searchQuery}
              onIonInput={(e) => setSearchQuery(e.detail.value!)}
              debounce={300}
              placeholder="Search trainings..."
            />

            <IonList>
              {filteredTrainings
                .slice(0, visibleCount)
                .map((training, index) => {
                  const trainingTypeObj = trainingTypes.find(
                    (type) => type.trainingTypeID === training.TrainingTypeID
                  );
                  const trainingType =
                    trainingTypeObj?.training_name || "Unknown";

                  return (
                    <IonItem
                      key={`${training.TrainingID || "noid"}-${
                        training.groupID || "nogroup"
                      }-${index}`}
                      button
                      onClick={() => handleView(training)}
                    >
                      <IonBadge
                        color="success"
                        slot="start"
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
                        <h2 style={{ fontWeight: 600, marginBottom: 4 }}>
                          {training.TrainingName || training.name}
                        </h2>
                        <IonText color="medium">
                          <p>
                            <strong>Training Type:</strong> {trainingType}
                          </p>
                          <p>
                            <strong>Start Date:</strong>{" "}
                            {formatDate(training.StartDate)}
                          </p>
                          <p>
                            <strong>Finish Date:</strong>{" "}
                            {formatDate(training.FinishDate)}
                          </p>
                        </IonText>
                      </IonLabel>

                      <IonIcon
                        icon={eye}
                        style={{ cursor: "pointer" }}
                        color="primary"
                      />
                    </IonItem>
                  );
                })}
            </IonList>

            {/* ✅ Infinite Scroll */}
            <IonInfiniteScroll onIonInfinite={loadMore}>
              <IonInfiniteScrollContent
                loadingSpinner="bubbles"
                loadingText="Loading more trainings..."
              />
            </IonInfiniteScroll>
          </>
        )}

        {/* ✅ No trainings found */}
        {!loading && !error && filteredTrainings.length === 0 && (
          <IonText color="medium">
            <p style={{ textAlign: "center", marginTop: "20px" }}>
              No trainings found.
            </p>
          </IonText>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Trainings;
