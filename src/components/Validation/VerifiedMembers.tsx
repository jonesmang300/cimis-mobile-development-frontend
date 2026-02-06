import React, { useEffect, useRef, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonBadge,
  IonSelect,
  IonSelectOption,
  IonButtons,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
  IonLoading,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from "@ionic/react";

import { arrowBack, eyeOutline } from "ionicons/icons";
import { useIonRouter } from "@ionic/react";

import { apiGet } from "../../services/api";
import { useLocationFilters } from "../../hooks/useLocationFilters";
import "./VerifiedMembers.css";

const PAGE_SIZE = 20;

const VerifiedMembers: React.FC = () => {
  const router = useIonRouter();

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

  const [allData, setAllData] = useState<any[]>([]);
  const [visibleData, setVisibleData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  /* ===============================
     IMPORTANT: INFINITE SCROLL REF
  ================================ */
  const infiniteRef = useRef<HTMLIonInfiniteScrollElement | null>(null);

  /* ===============================
     RESET WHEN VC CHANGES
  ================================ */
  useEffect(() => {
    setAllData([]);
    setVisibleData([]);

    // IMPORTANT: re-enable infinite scroll when VC changes
    if (infiniteRef.current) {
      infiniteRef.current.disabled = false;
    }
  }, [vc]);

  /* ===============================
     LOAD VERIFIED BENEFICIARIES
  ================================ */
  useEffect(() => {
    if (!vc) return;

    const load = async () => {
      setLoading(true);

      try {
        // IMPORTANT: re-enable infinite scroll every time we reload
        if (infiniteRef.current) {
          infiniteRef.current.disabled = false;
        }

        const rows = await apiGet<any[]>(
          `/beneficiaries/verified?villageClusterID=${vc}`,
        );

        const data = Array.isArray(rows) ? rows : [];

        setAllData(data);
        setVisibleData(data.slice(0, PAGE_SIZE));
      } catch (err) {
        console.error("Load verified failed:", err);
        setAllData([]);
        setVisibleData([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [vc]);

  /* ===============================
     LOAD MORE (ION INFINITE SCROLL)
  ================================ */
  const loadMore = async (ev: CustomEvent<void>) => {
    const next = visibleData.length + PAGE_SIZE;
    const nextItems = allData.slice(0, next);

    setVisibleData(nextItems);

    // complete the infinite scroll
    (ev.target as HTMLIonInfiniteScrollElement).complete();

    // disable if finished
    if (nextItems.length >= allData.length) {
      (ev.target as HTMLIonInfiniteScrollElement).disabled = true;
    }
  };

  const hasData = allData.length > 0;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => router.goBack()}>
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>Verified Members</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding verified-members-page">
        {/* FILTER CARD */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Filter Verified Members</IonCardTitle>
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

        {/* VERIFIED LIST */}
        {loading ? (
          <div className="verified-members-spinner">
            <IonSpinner name="crescent" />
          </div>
        ) : !hasData ? (
          <IonBadge color="medium">No verified beneficiaries found</IonBadge>
        ) : (
          <>
            <IonList>
              {visibleData.map((m, idx) => (
                <IonItem key={m.sppCode || idx}>
                  <IonLabel>
                    <h2>{m.hh_head_name}</h2>
                    <p>{m.hh_code}</p>
                    <IonBadge color="success">
                      Group: {m.groupname || "No Group"}
                    </IonBadge>
                  </IonLabel>

                  <IonButton
                    slot="end"
                    fill="clear"
                    onClick={() => {
                      localStorage.setItem("view_sppCode", m.sppCode);
                      router.push(
                        `/view_verified_member/${encodeURIComponent(m.sppCode)}`,
                      );
                    }}
                  >
                    <IonIcon icon={eyeOutline} />
                  </IonButton>
                </IonItem>
              ))}
            </IonList>

            {/* Infinite scroll must be OUTSIDE IonList */}
            <IonInfiniteScroll
              ref={infiniteRef}
              onIonInfinite={loadMore}
              threshold="100px"
            >
              <IonInfiniteScrollContent
                loadingSpinner="crescent"
                loadingText="Loading more..."
              />
            </IonInfiniteScroll>

            {/* prevents last item being hidden */}
            <div className="bottom-spacer" />
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default VerifiedMembers;
