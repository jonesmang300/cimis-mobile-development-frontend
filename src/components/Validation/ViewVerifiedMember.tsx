import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonSpinner,
  IonBadge,
} from "@ionic/react";

import { arrowBack } from "ionicons/icons";
import { useIonRouter } from "@ionic/react";
import { useParams } from "react-router-dom";

import { apiGet } from "../../services/api";
import "./ViewVerifiedMember.css";

interface RouteParams {
  sppCode?: string;
}

const ViewVerifiedMember: React.FC = () => {
  const router = useIonRouter();
  const { sppCode } = useParams<RouteParams>();

  const [member, setMember] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Location Names
  const [regionName, setRegionName] = useState("N/A");
  const [districtName, setDistrictName] = useState("N/A");
  const [taName, setTaName] = useState("N/A");
  const [vcName, setVcName] = useState("N/A");

  /* ===============================
     LOAD VERIFIED MEMBER
  ================================ */
  useEffect(() => {
    if (!sppCode) return;

    const load = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        const data = await apiGet<any>(`/beneficiaries/${sppCode}`);
        setMember(data || null);
      } catch (err: any) {
        console.error("Load failed:", err);
        setMember(null);
        setErrorMsg(err?.message || "Failed to load member");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [sppCode]);

  /* ===============================
     LOAD LOCATION NAMES
  ================================ */
  useEffect(() => {
    if (!member) return;

    const loadNames = async () => {
      try {
        const regions = await apiGet<any[]>(`/regions`);
        const r = regions.find((x) => x.regionID === member.regionID);
        setRegionName(r?.name || member.regionID || "N/A");

        const districts = await apiGet<any[]>(
          `/districts?regionID=${encodeURIComponent(member.regionID)}`,
        );
        const d = districts.find((x) => x.DistrictID === member.districtID);
        setDistrictName(d?.DistrictName || member.districtID || "N/A");

        const tas = await apiGet<any[]>(
          `/tas?districtID=${encodeURIComponent(member.districtID)}`,
        );
        const t = tas.find((x) => x.TAID === member.taID);
        setTaName(t?.TAName || member.taID || "N/A");

        const vcs = await apiGet<any[]>(
          `/village-clusters?taID=${encodeURIComponent(member.taID)}`,
        );
        const v = vcs.find(
          (x) => x.villageClusterID === member.villageClusterID,
        );
        setVcName(v?.villageClusterName || member.villageClusterID || "N/A");
      } catch (err) {
        console.error("Failed loading location names:", err);
      }
    };

    loadNames();
  }, [member]);

  /* ===============================
     FORMATTERS
  ================================ */
  const formatSex = (sex: string) =>
    sex === "01" ? "Male" : sex === "02" ? "Female" : "N/A";

  const formatDate = (date: string) =>
    date ? new Date(date).toLocaleDateString() : "N/A";

  /* ===============================
     UI
  ================================ */
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => router.goBack()}>
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>Verified Member Details</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* IMPORTANT: fullscreen prevents bottom cut-off issues */}
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

            {/* IMPORTANT: prevents last item from hiding under tab bar */}
            <div className="bottom-spacer" />
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ViewVerifiedMember;
