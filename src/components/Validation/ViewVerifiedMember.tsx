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
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonRouter,
} from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import { useParams } from "react-router-dom";

import {
  getVerifiedMemberBySppCode,
  getLocationNamesForMember,
  VerifiedMemberDetails,
} from "../../services/viewVerifiedMember.service";

import "./ViewVerifiedMember.css";

interface RouteParams {
  sppCode?: string;
}

const ViewVerifiedMember: React.FC = () => {
  const router = useIonRouter();
  const { sppCode } = useParams<RouteParams>();

  const [member, setMember] = useState<VerifiedMemberDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [regionName, setRegionName] = useState("N/A");
  const [districtName, setDistrictName] = useState("N/A");
  const [taName, setTaName] = useState("N/A");
  const [vcName, setVcName] = useState("N/A");

  /* ===============================
     LOAD VERIFIED MEMBER
  ================================ */
  useEffect(() => {
    if (!sppCode) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        const data = await getVerifiedMemberBySppCode(sppCode);

        if (cancelled) return;

        setMember(data || null);
      } catch (err: any) {
        console.error("Load failed:", err);

        if (cancelled) return;

        setMember(null);
        setErrorMsg(err?.message || "Failed to load member");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [sppCode]);

  /* ===============================
     LOAD LOCATION NAMES
  ================================ */
  useEffect(() => {
    if (!member) return;

    let cancelled = false;

    // reset names immediately to avoid showing old data
    setRegionName("N/A");
    setDistrictName("N/A");
    setTaName("N/A");
    setVcName("N/A");

    const loadNames = async () => {
      try {
        const names = await getLocationNamesForMember(member);

        if (cancelled) return;

        setRegionName(names.regionName);
        setDistrictName(names.districtName);
        setTaName(names.taName);
        setVcName(names.vcName);
      } catch (err) {
        console.error("Failed loading location names:", err);
      }
    };

    loadNames();

    return () => {
      cancelled = true;
    };
  }, [member]);

  /* ===============================
     FORMATTERS
  ================================ */
  const formatSex = (sex?: string) =>
    sex === "01" ? "Male" : sex === "02" ? "Female" : "N/A";

  const formatDate = (date?: string) => {
    if (!date) return "N/A";

    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "N/A";

    return d.toLocaleDateString();
  };

  /* ===============================
     UI
  ================================ */
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonButtons slot="start">
            <IonButton onClick={() => router.goBack()} color="light">
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle style={{ color: "white" }}>Verified Member Details</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding view-verified-member-page">
        {loading ? (
          <div className="view-verified-spinner">
            <IonSpinner name="crescent" />
          </div>
        ) : errorMsg ? (
          <IonBadge className="view-verified-badge" color="danger">
            {errorMsg}
          </IonBadge>
        ) : !member ? (
          <IonBadge className="view-verified-badge" color="medium">
            Member not found
          </IonBadge>
        ) : (
          <>
            {/* LOCATION DETAILS */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Location Details</IonCardTitle>
              </IonCardHeader>

              <IonCardContent>
                <IonItem>
                  <IonLabel>
                    <strong>Region</strong>
                    <p>{regionName}</p>
                  </IonLabel>
                </IonItem>

                <IonItem>
                  <IonLabel>
                    <strong>District</strong>
                    <p>{districtName}</p>
                  </IonLabel>
                </IonItem>

                <IonItem>
                  <IonLabel>
                    <strong>Traditional Authority</strong>
                    <p>{taName}</p>
                  </IonLabel>
                </IonItem>

                <IonItem>
                  <IonLabel>
                    <strong>Village Cluster</strong>
                    <p>{vcName}</p>
                  </IonLabel>
                </IonItem>

                <IonItem>
                  <IonLabel>
                    <strong>Group Name</strong>
                    <p>{member.groupname || "N/A"}</p>
                  </IonLabel>
                </IonItem>
              </IonCardContent>
            </IonCard>

            {/* BENEFICIARY DETAILS */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Beneficiary Details</IonCardTitle>
              </IonCardHeader>

              <IonCardContent>
                <IonItem>
                  <IonLabel>
                    <strong>Household Head Name</strong>
                    <p>{member.hh_head_name || "N/A"}</p>
                  </IonLabel>
                </IonItem>

                <IonItem>
                  <IonLabel>
                    <strong>Sex</strong>
                    <p>{formatSex(member.sex)}</p>
                  </IonLabel>
                </IonItem>

                <IonItem>
                  <IonLabel>
                    <strong>Date of Birth</strong>
                    <p>{formatDate(member.dob)}</p>
                  </IonLabel>
                </IonItem>

                <IonItem>
                  <IonLabel>
                    <strong>National ID</strong>
                    <p>{member.nat_id || "N/A"}</p>
                  </IonLabel>
                </IonItem>

                <IonItem>
                  <IonLabel>
                    <strong>Household Size</strong>
                    <p>{member.hh_size ?? "N/A"}</p>
                  </IonLabel>
                </IonItem>

                <IonItem>
                  <IonLabel>
                    <strong>Household Code</strong>
                    <p>{member.hh_code || "N/A"}</p>
                  </IonLabel>
                </IonItem>
              </IonCardContent>
            </IonCard>

            <div className="bottom-spacer" />
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ViewVerifiedMember;
