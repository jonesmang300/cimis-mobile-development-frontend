import React, { useEffect, useRef, useState } from "react";
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
  IonInfiniteScroll,
  IonInfiniteScrollContent,
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
import { arrowBack, eyeOutline } from "ionicons/icons";

import { useLocationFilters } from "../../hooks/useLocationFilters";
import { useLocalInfiniteScroll } from "../../hooks/useLocalInfiniteScroll";

import {
  getVerifiedMembers,
  VerifiedMember,
} from "../../services/verifiedMembers.service";

import "./VerifiedMembers.css";

/* ===============================
   CONFIG
================================ */
const PAGE_SIZE = 20;

const VerifiedMembers: React.FC = () => {
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
  const [members, setMembers] = useState<VerifiedMember[]>([]);
  const [loading, setLoading] = useState(false);

  /* ===============================
     INFINITE SCROLL (REUSABLE)
  ================================ */
  const { visible, loadMore, resetKey } =
    useLocalInfiniteScroll<VerifiedMember>({
      items: members,
      pageSize: PAGE_SIZE,
    });

  const infiniteRef = useRef<HTMLIonInfiniteScrollElement | null>(null);

  /* ===============================
     RESET WHEN VC CHANGES
  ================================ */
  useEffect(() => {
    setMembers([]);

    if (infiniteRef.current) {
      infiniteRef.current.disabled = false;
    }
  }, [vc]);

  /* ===============================
     LOAD VERIFIED MEMBERS (ALL)
  ================================ */
  useEffect(() => {
    if (!vc) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);

      try {
        if (infiniteRef.current) {
          infiniteRef.current.disabled = false;
        }

        const rows = await getVerifiedMembers(vc);

        if (cancelled) return;

        setMembers(Array.isArray(rows) ? rows : []);
      } catch (err) {
        console.error("Load verified failed:", err);

        if (!cancelled) {
          setMembers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [vc]);

  const hasData = members.length > 0;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonButtons slot="start">
            <IonButton onClick={() => router.goBack()} color="light">
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle style={{ color: "white" }}>Verified Members</IonTitle>
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
              {visible.map((m, idx) => (
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

            <IonInfiniteScroll
              key={resetKey}
              ref={infiniteRef}
              onIonInfinite={loadMore}
              threshold="100px"
            >
              <IonInfiniteScrollContent
                loadingSpinner="crescent"
                loadingText="Loading more..."
              />
            </IonInfiniteScroll>

            <div className="bottom-spacer" />
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default VerifiedMembers;
