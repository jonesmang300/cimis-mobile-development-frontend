import {
  IonBadge,
  IonCardHeader,
  IonCardTitle,
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonTitle,
  IonContent,
  IonList,
  IonCard,
  IonCardContent,
  IonLabel,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLoading,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  useIonViewWillEnter,
} from "@ionic/react";
import {
  arrowBack,
  cashOutline,
  schoolOutline,
  listOutline,
  peopleOutline,
  pieChartOutline,
} from "ionicons/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { apiGet } from "../services/api";
import { useLocalInfiniteScroll } from "../hooks/useLocalInfiniteScroll";
import { useLocationFilters } from "../hooks/useLocationFilters";
import { GroupTraining, Meeting, GroupIGA, MemberIGA } from "../services/groupOperations.service";
import { GroupSaving, MemberSaving } from "../services/savings.service";
import { subscribeSyncUpdates } from "../data/sync";
import "./Groups.css";

type GroupRow = {
  groupID: string;
  groupname: string;
  regionID?: string;
  DistrictID?: string;
  districtID?: string;
  TAID?: string;
  taID?: string;
  villageClusterID?: string;
};

type DashboardMetric =
  | "all"
  | "trainings"
  | "meetings"
  | "savings"
  | "group-igas"
  | "member-igas";

const Group: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [loadingGroups, setLoadingGroups] = useState<boolean>(true);
  const [selectedGroup, setSelectedGroup] = useState<GroupRow | null>(null);
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

  const dashboardMetric = useMemo<DashboardMetric>(() => {
    const value = new URLSearchParams(location.search).get("metric");
    switch (value) {
      case "trainings":
      case "meetings":
      case "savings":
      case "group-igas":
      case "member-igas":
      case "all":
        return value;
      default:
        return "all";
    }
  }, [location.search]);

  // Dashboard menu items
  const menuItems = [
    {
      label: "Beneficiaries",
      icon: peopleOutline,
      route: "/groups/beneficiaries",
    },
    { label: "Group Savings", icon: cashOutline, route: "/groups/savings" },
    { label: "Trainings", icon: schoolOutline, route: "/groups/trainings" },
    {
      label: "Meetings & Attendance",
      icon: listOutline,
      route: "/groups/attendance",
    },
    { label: "Group IGA", icon: pieChartOutline, route: "/groups/group-iga" },
  ];

  const scopedGroups = useMemo(() => {
    if (!vc) {
      return [];
    }

    return groups.filter((group) => {
      const groupVcId = String(group.villageClusterID || "").trim();

      return groupVcId === vc;
    });
  }, [groups, vc]);

  const eligibleRegionIds = useMemo(
    () =>
      new Set(
        groups
          .map((group) => String(group.regionID || "").trim())
          .filter(Boolean),
      ),
    [groups],
  );

  const eligibleDistrictIds = useMemo(
    () =>
      new Set(
        groups
          .map((group) => String(group.DistrictID || group.districtID || "").trim())
          .filter(Boolean),
      ),
    [groups],
  );

  const eligibleTaIds = useMemo(
    () =>
      new Set(
        groups
          .map((group) => String(group.TAID || group.taID || "").trim())
          .filter(Boolean),
      ),
    [groups],
  );

  const eligibleVillageClusterIds = useMemo(
    () =>
      new Set(
        groups
          .map((group) => String(group.villageClusterID || "").trim())
          .filter(Boolean),
      ),
    [groups],
  );

  const visibleRegions = useMemo(
    () =>
      regions.filter((row) =>
        eligibleRegionIds.has(String(row.regionID || "").trim()),
      ),
    [eligibleRegionIds, regions],
  );

  const visibleDistricts = useMemo(
    () =>
      districts.filter((row) =>
        eligibleDistrictIds.has(String(row.DistrictID || "").trim()),
      ),
    [districts, eligibleDistrictIds],
  );

  const visibleTas = useMemo(
    () =>
      tas.filter((row) => eligibleTaIds.has(String(row.TAID || "").trim())),
    [eligibleTaIds, tas],
  );

  const visibleVcs = useMemo(
    () =>
      vcs.filter((row) =>
        eligibleVillageClusterIds.has(String(row.villageClusterID || "").trim()),
      ),
    [eligibleVillageClusterIds, vcs],
  );

  const {
    visible: visibleGroups,
    loadMore,
    resetKey,
  } = useLocalInfiniteScroll<GroupRow>({
    items: scopedGroups,
    pageSize: 20,
  });

  const loadGroups = useCallback(async () => {
    setLoadingGroups(true);

    try {
      const rows = await apiGet<GroupRow[]>("/groups");
      const allGroups = Array.isArray(rows) ? rows : [];

      if (dashboardMetric === "all") {
        setGroups(allGroups);
        return;
      }

      let eligibleGroupIds = new Set<string>();

      if (dashboardMetric === "trainings") {
        const trainingRows = await apiGet<GroupTraining[]>("/group-trainings");
        eligibleGroupIds = new Set(
          (Array.isArray(trainingRows) ? trainingRows : [])
            .map((row) => String(row.groupID || "").trim())
            .filter(Boolean),
        );
      } else if (dashboardMetric === "meetings") {
        const meetingRows = await apiGet<Meeting[]>("/meetings");
        eligibleGroupIds = new Set(
          (Array.isArray(meetingRows) ? meetingRows : [])
            .map((row) => String(row.groupCode || "").trim())
            .filter(Boolean),
        );
      } else if (dashboardMetric === "savings") {
        const [groupSavings, memberSavings] = await Promise.all([
          apiGet<GroupSaving[]>("/group-savings"),
          apiGet<MemberSaving[]>("/member-savings"),
        ]);
        eligibleGroupIds = new Set(
          [
            ...(Array.isArray(groupSavings) ? groupSavings : []).map((row) =>
              String(row.GroupID || "").trim(),
            ),
            ...(Array.isArray(memberSavings) ? memberSavings : []).map((row) =>
              String(row.groupCode || "").trim(),
            ),
          ].filter(Boolean),
        );
      } else if (dashboardMetric === "group-igas") {
        const igaRows = await apiGet<GroupIGA[]>("/group-igas");
        eligibleGroupIds = new Set(
          (Array.isArray(igaRows) ? igaRows : [])
            .map((row) => String(row.groupID || "").trim())
            .filter(Boolean),
        );
      } else if (dashboardMetric === "member-igas") {
        const igaRows = await apiGet<MemberIGA[]>("/member-igas");
        eligibleGroupIds = new Set(
          (Array.isArray(igaRows) ? igaRows : [])
            .map((row) => String(row.groupID || "").trim())
            .filter(Boolean),
        );
      }

      setGroups(
        allGroups.filter((group) =>
          eligibleGroupIds.has(String(group.groupID || "").trim()),
        ),
      );
    } catch (error) {
      console.error("Failed to load groups:", error);
      setGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  }, [dashboardMetric]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await loadGroups();
      } catch (error) {
        console.error("Failed to load groups:", error);
        if (!cancelled) setGroups([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadGroups]);

  useEffect(() => {
    const unsubscribeSync = subscribeSyncUpdates(() => {
      loadGroups();
    });
    return () => {
      unsubscribeSync();
    };
  }, [loadGroups]);

  useIonViewWillEnter(() => {
    loadGroups();
  });

  const handleSelectGroup = (group: GroupRow) => {
    setSelectedGroup(group);
    localStorage.setItem("selectedGroupID", group.groupID);
    localStorage.setItem("selectedGroupName", group.groupname || "");
  };

  const showGroupMenu = selectedGroup !== null;
  const hasVillageClusterFilter = Boolean(vc);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonButtons slot="start">
            <IonButton
              onClick={() => {
                if (showGroupMenu) {
                  setSelectedGroup(null);
                  return;
                }
                history.goBack();
              }}
              color="light"
            >
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle className="white-title">
          {showGroupMenu ? "Group" : "Select Group"}
          </IonTitle>
          {showGroupMenu && selectedGroup && (
            <IonButtons slot="end">
              <IonButton onClick={() => setSelectedGroup(null)} color="light">
                Change
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {!showGroupMenu ? (
          <>
            {loadingGroups ? (
              <div className="groups-loading">
                <IonSpinner name="crescent" />
              </div>
            ) : groups.length === 0 ? (
              <IonBadge color="medium">No groups found</IonBadge>
            ) : (
              <IonCard className="groups-list-card">
                <IonCardHeader>
                  <IonCardTitle>Groups</IonCardTitle>
                </IonCardHeader>

                <IonCardContent>
                  <IonCard className="groups-filter-card">
                    <IonCardHeader>
                      <IonCardTitle>
                        {dashboardMetric === "all"
                          ? "Filter by Location"
                          : "Filter Matching Records"}
                      </IonCardTitle>
                    </IonCardHeader>

                    <IonCardContent>
                      <IonItem>
                        <IonLabel position="stacked">Region</IonLabel>
                        <IonSelect
                          value={region}
                          onIonChange={(e) => setRegion(e.detail.value)}
                        >
                          {visibleRegions.map((r) => (
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
                          {visibleDistricts.map((d) => (
                            <IonSelectOption
                              key={d.DistrictID}
                              value={d.DistrictID}
                            >
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
                          {visibleTas.map((t) => (
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
                          {visibleVcs.map((v) => (
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

                  {!hasVillageClusterFilter ? (
                    <IonBadge color="medium">
                      Select a village cluster to view groups
                    </IonBadge>
                  ) : scopedGroups.length === 0 ? (
                    <IonBadge color="medium">
                      No groups found in the selected village cluster
                    </IonBadge>
                  ) : (
                    <IonList>
                      {visibleGroups.map((group) => (
                        <IonItem
                          key={group.groupID}
                          button
                          detail
                          onClick={() => handleSelectGroup(group)}
                        >
                          <IonLabel>
                            <h2>{group.groupname || "Unnamed Group"}</h2>
                            <p>{group.groupID}</p>
                          </IonLabel>
                        </IonItem>
                      ))}
                    </IonList>
                  )}

                  {hasVillageClusterFilter && scopedGroups.length > 0 && (
                    <IonInfiniteScroll
                      key={resetKey}
                      threshold="100px"
                      onIonInfinite={loadMore}
                    >
                      <IonInfiniteScrollContent
                        loadingSpinner="crescent"
                        loadingText="Loading more groups..."
                      />
                    </IonInfiniteScroll>
                  )}
                </IonCardContent>
              </IonCard>
            )}
          </>
        ) : (
          <>
            <IonCard className="selected-group-card">
              <IonCardContent>
                <IonLabel>
                  <h2>{selectedGroup?.groupname}</h2>
                  <p>{selectedGroup?.groupID}</p>
                </IonLabel>
              </IonCardContent>
            </IonCard>

            <IonList>
              {menuItems.map((item) => (
                <IonCard
                  key={item.label}
                  button
                  onClick={() => history.push(item.route)}
                  className="group-card"
                >
                  <IonCardContent className="group-card-content">
                    <IonIcon icon={item.icon} className="group-card-icon" />
                    <IonLabel>{item.label}</IonLabel>
                  </IonCardContent>
                </IonCard>
              ))}
            </IonList>
          </>
        )}
        <IonLoading
          isOpen={isFilterLoading}
          spinner="crescent"
          message="Loading filters..."
        />
      </IonContent>
    </IonPage>
  );
};

export default Group;
