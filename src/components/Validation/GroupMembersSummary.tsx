import React, { useEffect, useState } from "react";
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonLoading,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonRouter,
} from "@ionic/react";

import { arrowBack } from "ionicons/icons";

import { useLocationFilters } from "../../hooks/useLocationFilters";

import {
  getGroupMembersSummary,
  getVerifiedTotals,
  GroupSummaryRow,
  VerifiedTotals,
} from "../../services/groupMembersSummary.service";

import "./GroupMembersSummary.css";

const GroupMembersSummary: React.FC = () => {
  const router = useIonRouter();

  /* ===============================
     FILTERS
  ================================ */
  const {
    regions,
    districts,
    tas,
    vcs,

    region,
    district,
    ta,
    vc,

    setRegion,
    setDistrict,
    setTa,
    setVc,

    loadingDistricts,
    loadingTas,
    loadingVcs,
    isFilterLoading,
  } = useLocationFilters();

  /* ===============================
     DATA
  ================================ */
  const [rows, setRows] = useState<GroupSummaryRow[]>([]);
  const [verifiedTotals, setVerifiedTotals] = useState<VerifiedTotals>({
    M: 0,
    F: 0,
    Total: 0,
  });

  const [loading, setLoading] = useState(false);
  const [loadingVerified, setLoadingVerified] = useState(false);

  /* ===============================
     RESET WHEN VC CHANGES
  ================================ */
  useEffect(() => {
    setRows([]);
    setVerifiedTotals({ M: 0, F: 0, Total: 0 });
  }, [vc]);

  /* ===============================
     LOAD GROUP SUMMARY
  ================================ */
  useEffect(() => {
    if (!vc) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);

      try {
        const data = await getGroupMembersSummary(vc);

        if (cancelled) return;

        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Load group summary failed:", err);
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [vc]);

  /* ===============================
     LOAD VERIFIED TOTALS
  ================================ */
  useEffect(() => {
    if (!vc) return;

    let cancelled = false;

    const loadVerified = async () => {
      setLoadingVerified(true);

      try {
        const totals = await getVerifiedTotals(vc);

        if (cancelled) return;

        setVerifiedTotals(totals);
      } catch (err) {
        console.error("Load verified totals failed:", err);
        if (!cancelled) setVerifiedTotals({ M: 0, F: 0, Total: 0 });
      } finally {
        if (!cancelled) setLoadingVerified(false);
      }
    };

    loadVerified();

    return () => {
      cancelled = true;
    };
  }, [vc]);

  const hasData = rows.length > 0;

  /* ===============================
     TOTALS (FROM GROUPS)
  ================================ */
  const totals = rows.reduce(
    (acc, r) => {
      acc.males += Number(r.males || 0);
      acc.females += Number(r.females || 0);
      acc.total += Number(r.total || 0);
      return acc;
    },
    { males: 0, females: 0, total: 0 },
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => router.goBack()}>
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>Group Members Summary</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding group-summary-page">
        {/* FILTER CARD */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Filter by Location</IonCardTitle>
          </IonCardHeader>

          <IonCardContent>
            <IonItem>
              <IonLabel position="stacked">Region</IonLabel>
              <IonSelect
                value={region}
                onIonChange={(e) => setRegion(e.detail.value)}
              >
                {regions.map((r) => (
                  <IonSelectOption key={r.regionID} value={r.regionID}>
                    {r.name}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">District</IonLabel>
              <IonSelect
                value={district}
                disabled={!region || loadingDistricts}
                onIonChange={(e) => setDistrict(e.detail.value)}
              >
                {districts.map((d) => (
                  <IonSelectOption key={d.DistrictID} value={d.DistrictID}>
                    {d.DistrictName}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Traditional Authority</IonLabel>
              <IonSelect
                value={ta}
                disabled={!district || loadingTas}
                onIonChange={(e) => setTa(e.detail.value)}
              >
                {tas.map((t) => (
                  <IonSelectOption key={t.TAID} value={t.TAID}>
                    {t.TAName}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Village Cluster</IonLabel>
              <IonSelect
                value={vc}
                disabled={!ta || loadingVcs}
                onIonChange={(e) => setVc(e.detail.value)}
              >
                {vcs.map((v) => (
                  <IonSelectOption
                    key={v.villageClusterID}
                    value={v.villageClusterID}
                  >
                    {v.villageClusterName}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
          </IonCardContent>
        </IonCard>

        <IonLoading
          isOpen={isFilterLoading}
          spinner="crescent"
          message="Loading filters..."
        />

        {/* LOADING */}
        {loading ? (
          <div className="group-summary-spinner">
            <IonSpinner name="crescent" />
          </div>
        ) : !hasData ? (
          <IonBadge color="medium">No groups found</IonBadge>
        ) : (
          <>
            {/* VERIFIED TOTALS */}
            <IonCard className="summary-total-card">
              <IonCardHeader>
                <IonCardTitle>Totals (Verified Members)</IonCardTitle>
              </IonCardHeader>

              <IonCardContent className="summary-totals">
                {loadingVerified ? (
                  <IonSpinner name="crescent" />
                ) : (
                  <>
                    <div>
                      <strong>M:</strong>{" "}
                      <IonBadge color="primary">{verifiedTotals.M}</IonBadge>
                    </div>
                    <div>
                      <strong>F:</strong>{" "}
                      <IonBadge color="danger">{verifiedTotals.F}</IonBadge>
                    </div>
                    <div>
                      <strong>Total:</strong>{" "}
                      <IonBadge color="success">
                        {verifiedTotals.Total}
                      </IonBadge>
                    </div>
                  </>
                )}
              </IonCardContent>
            </IonCard>

            {/* GROUP LIST */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Groups</IonCardTitle>
              </IonCardHeader>

              <IonCardContent>
                <IonList>
                  {rows.map((r, idx) => (
                    <IonItem key={`${r.groupname}-${idx}`}>
                      <IonLabel>
                        <h2>{r.groupname || "No Group"}</h2>
                        <p>
                          M: {r.males} | F: {r.females} | Total: {r.total}
                        </p>
                      </IonLabel>

                      <IonBadge slot="end" color="success">
                        {r.total}
                      </IonBadge>
                    </IonItem>
                  ))}
                </IonList>
              </IonCardContent>
            </IonCard>

            <div className="bottom-spacer" />
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default GroupMembersSummary;
