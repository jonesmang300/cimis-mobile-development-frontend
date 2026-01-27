import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonList,
  IonCheckbox,
  IonButton,
  IonBadge,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonToast,
  IonButtons,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import { useIonRouter } from "@ionic/react";

/* ===============================
   LOCAL BENEFICIARIES
================================ */
const beneficiaries = [
  {
    hh_head_name: "John Banda",
    hh_code: "HH001",
    sex: "M",
    dob: "1990-05-12",
    region: "Central",
    district: "Lilongwe",
    ta: "Kalolo",
    vc: "VC-01",
  },
  {
    hh_head_name: "Mary Phiri",
    hh_code: "HH002",
    sex: "",
    dob: "",
    region: "Central",
    district: "Lilongwe",
    ta: "Kalolo",
    vc: "VC-02",
  },
  {
    hh_head_name: "Peter Chirwa",
    hh_code: "HH003",
    sex: "M",
    dob: "",
    region: "Southern",
    district: "Blantyre",
    ta: "Kapeni",
    vc: "VC-01",
  },
  {
    hh_head_name: "Agnes Mbewe",
    hh_code: "HH004",
    sex: "",
    dob: "",
    region: "Northern",
    district: "Mzimba",
    ta: "Mpherembe",
    vc: "VC-03",
  },
];

/* ===============================
   COMPONENT
================================ */
const GroupAssignment: React.FC = () => {
  const router = useIonRouter();

  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  /* FILTER STATE */
  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [ta, setTa] = useState("");
  const [vc, setVc] = useState("");

  useEffect(() => {
    setMembers(beneficiaries);
  }, []);

  /* ===============================
     FILTER OPTIONS
  =============================== */
  const regions = [...new Set(beneficiaries.map((b) => b.region))];

  const districts = [
    ...new Set(
      beneficiaries
        .filter((b) => !region || b.region === region)
        .map((b) => b.district),
    ),
  ];

  const tas = [
    ...new Set(
      beneficiaries
        .filter(
          (b) =>
            (!region || b.region === region) &&
            (!district || b.district === district),
        )
        .map((b) => b.ta),
    ),
  ];

  const vcs = [
    ...new Set(
      beneficiaries
        .filter(
          (b) =>
            (!region || b.region === region) &&
            (!district || b.district === district) &&
            (!ta || b.ta === ta),
        )
        .map((b) => b.vc),
    ),
  ];

  const filteredMembers = members.filter(
    (m) =>
      (!region || m.region === region) &&
      (!district || m.district === district) &&
      (!ta || m.ta === ta) &&
      (!vc || m.vc === vc),
  );

  /* ===============================
     SELECT / UNSELECT
  =============================== */
  const toggleMember = (member: any) => {
    setSelectedMembers((prev) => {
      const exists = prev.find((m) => m.hh_code === member.hh_code);
      return exists
        ? prev.filter((m) => m.hh_code !== member.hh_code)
        : [...prev, member];
    });
  };

  /* ===============================
     SAVE EDIT
  =============================== */
  const saveEditedMember = () => {
    if (!editingMember) return;

    setMembers((prev) =>
      prev.map((m) =>
        m.hh_code === editingMember.hh_code ? editingMember : m,
      ),
    );

    setSelectedMembers((prev) =>
      prev.map((m) =>
        m.hh_code === editingMember.hh_code ? editingMember : m,
      ),
    );

    setShowEditModal(false);
  };

  /* ===============================
     SUBMIT
  =============================== */
  const submitGroup = () => {
    if (!groupName.trim()) {
      setToastMessage("Group name is required");
      return;
    }

    if (selectedMembers.length === 0) {
      setToastMessage("Select at least one beneficiary");
      return;
    }

    const incomplete = selectedMembers.find((m) => !m.sex || !m.dob);
    if (incomplete) {
      setToastMessage("Some selected beneficiaries require Sex and DOB");
      return;
    }

    setToastMessage("Group created successfully");
    setGroupName("");
    setSelectedMembers([]);
  };

  /* ===============================
     UI
  =============================== */
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => router.goBack()}>
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>Group Assignment</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* FILTER CARD */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Filter Beneficiaries</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel position="stacked">Region</IonLabel>
              <IonSelect
                value={region}
                onIonChange={(e) => {
                  setRegion(e.detail.value);
                  setDistrict("");
                  setTa("");
                  setVc("");
                }}
              >
                {regions.map((r) => (
                  <IonSelectOption key={r} value={r}>
                    {r}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">District</IonLabel>
              <IonSelect
                value={district}
                disabled={!region}
                onIonChange={(e) => {
                  setDistrict(e.detail.value);
                  setTa("");
                  setVc("");
                }}
              >
                {districts.map((d) => (
                  <IonSelectOption key={d} value={d}>
                    {d}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Traditional Authority</IonLabel>
              <IonSelect
                value={ta}
                disabled={!district}
                onIonChange={(e) => {
                  setTa(e.detail.value);
                  setVc("");
                }}
              >
                {tas.map((t) => (
                  <IonSelectOption key={t} value={t}>
                    {t}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Village Cluster</IonLabel>
              <IonSelect
                value={vc}
                disabled={!ta}
                onIonChange={(e) => setVc(e.detail.value)}
              >
                {vcs.map((v) => (
                  <IonSelectOption key={v} value={v}>
                    {v}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
          </IonCardContent>
        </IonCard>

        {/* GROUP DETAILS CARD (GROUP NAME + COUNT + MEMBERS LIST) */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Group Details</IonCardTitle>
          </IonCardHeader>

          <IonCardContent>
            {/* GROUP NAME */}
            <IonItem>
              <IonLabel position="stacked">Group Name *</IonLabel>
              <IonInput
                value={groupName}
                onIonInput={(e) => setGroupName(e.detail.value!)}
              />
            </IonItem>

            {/* SELECTED COUNT */}
            <IonItem lines="none">
              <IonLabel>Selected Beneficiaries</IonLabel>
              <IonBadge slot="end" color="success">
                {selectedMembers.length}
              </IonBadge>
            </IonItem>

            {/* MEMBERS LIST (INSIDE CARD) */}
            <IonList>
              {filteredMembers.map((member) => {
                const isSelected = selectedMembers.some(
                  (m) => m.hh_code === member.hh_code,
                );
                const requiresEdit = !member.sex || !member.dob;

                return (
                  <IonItem key={member.hh_code}>
                    <IonCheckbox
                      slot="start"
                      checked={isSelected}
                      onIonChange={() => toggleMember(member)}
                    />
                    <IonLabel>
                      <h2>{member.hh_head_name}</h2>
                      <p>
                        <strong>Code:</strong> {member.hh_code}
                      </p>
                      <IonBadge color={requiresEdit ? "danger" : "success"}>
                        {requiresEdit ? "REQUIRES EDIT" : "COMPLETE"}
                      </IonBadge>
                    </IonLabel>
                    <IonButton
                      fill="clear"
                      size="small"
                      onClick={() => {
                        setEditingMember(member);
                        setShowEditModal(true);
                      }}
                    >
                      Edit
                    </IonButton>
                  </IonItem>
                );
              })}
            </IonList>
          </IonCardContent>
        </IonCard>

        <IonButton
          expand="block"
          color="success"
          onClick={submitGroup}
          style={{ marginTop: 20 }}
        >
          Submit Group
        </IonButton>

        {/* EDIT MODAL */}
        <IonModal
          isOpen={showEditModal}
          onDidDismiss={() => setShowEditModal(false)}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Edit Beneficiary</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowEditModal(false)}>
                  Close
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding">
            {editingMember && (
              <>
                <IonItem>
                  <IonLabel position="stacked">Sex *</IonLabel>
                  <IonSelect
                    value={editingMember.sex}
                    onIonChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        sex: e.detail.value,
                      })
                    }
                  >
                    <IonSelectOption value="M">Male</IonSelectOption>
                    <IonSelectOption value="F">Female</IonSelectOption>
                  </IonSelect>
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Date of Birth *</IonLabel>
                  <IonDatetime
                    presentation="date"
                    value={editingMember.dob}
                    onIonChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        dob: e.detail.value,
                      })
                    }
                  />
                </IonItem>

                <IonButton
                  expand="block"
                  color="success"
                  onClick={saveEditedMember}
                  style={{ marginTop: 20 }}
                >
                  Save Changes
                </IonButton>
              </>
            )}
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage}
          duration={3000}
          onDidDismiss={() => setToastMessage("")}
        />
      </IonContent>
    </IonPage>
  );
};

export default GroupAssignment;
