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
    nat_id: "MW90123456",
  },
  {
    hh_head_name: "Mary Phiri",
    hh_code: "HH002",
    sex: "",
    dob: "",
    nat_id: "",
  },
  {
    hh_head_name: "Peter Chirwa",
    hh_code: "HH003",
    sex: "M",
    dob: "",
    nat_id: "MW88112233",
  },
  {
    hh_head_name: "Agnes Mbewe",
    hh_code: "HH004",
    sex: "",
    dob: "",
    nat_id: "",
  },
  {
    hh_head_name: "James Zulu",
    hh_code: "HH005",
    sex: "M",
    dob: "1985-09-21",
    nat_id: "",
  },
  {
    hh_head_name: "Esther Kamanga",
    hh_code: "HH006",
    sex: "F",
    dob: "1994-02-08",
    nat_id: "MW94007891",
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

  /* ===============================
     LOAD MEMBERS
  =============================== */
  useEffect(() => {
    setMembers(beneficiaries);
  }, []);

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
     SUBMIT GROUP
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
        {/* GROUP NAME */}
        <IonItem>
          <IonLabel position="stacked">Group Name *</IonLabel>
          <IonInput
            value={groupName}
            placeholder="Enter group name"
            onIonInput={(e) => setGroupName(e.detail.value!)}
          />
        </IonItem>

        <IonLabel style={{ margin: "12px 0", display: "block" }}>
          Selected Beneficiaries{" "}
          <IonBadge color="success">{selectedMembers.length}</IonBadge>
        </IonLabel>

        {/* MEMBERS LIST */}
        <IonList inset>
          {members.map((member) => {
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

                  {requiresEdit ? (
                    <IonBadge color="danger">REQUIRES EDIT</IonBadge>
                  ) : (
                    <IonBadge color="success">COMPLETE</IonBadge>
                  )}
                </IonLabel>

                <IonButton
                  fill="clear"
                  size="small"
                  color={requiresEdit ? "danger" : "primary"}
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
                {/* SEX */}
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

                {/* DOB */}
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

                {/* NATIONAL ID (OPTIONAL) */}
                <IonItem>
                  <IonLabel position="stacked">National ID (Optional)</IonLabel>
                  <IonInput
                    value={editingMember.nat_id}
                    placeholder="Enter National ID"
                    onIonInput={(e) =>
                      setEditingMember({
                        ...editingMember,
                        nat_id: e.detail.value!,
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
