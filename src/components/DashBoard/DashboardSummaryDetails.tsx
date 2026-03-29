import React, { useCallback, useMemo, useState } from "react";
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonList,
  IonPage,
  IonSearchbar,
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonViewWillEnter,
} from "@ionic/react";
import {
  arrowBack,
  checkmarkCircleOutline,
  cashOutline,
  listOutline,
  peopleOutline,
  pieChartOutline,
  schoolOutline,
  storefrontOutline,
  barChartOutline,
} from "ionicons/icons";
import { useHistory, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getDashboardMetricItems,
  SummaryDetailItem,
  SummaryMetricKey,
} from "../../services/dashboard.service";
import { useLocalInfiniteScroll } from "../../hooks/useLocalInfiniteScroll";
import "./DashboardSummaryDetails.css";

type Params = {
  metricKey: SummaryMetricKey;
};

const metricConfig: Record<
  SummaryMetricKey,
  {
    title: string;
    helper: string;
    icon: string;
  }
> = {
  verified: {
    title: "Beneficiaries Allocated to Groups",
    helper: "Allocated beneficiaries",
    icon: checkmarkCircleOutline,
  },
  myVerified: {
    title: "My Verified Members",
    helper: "Verified on this device",
    icon: pieChartOutline,
  },
  groups: {
    title: "Groups Formed",
    helper: "Groups visible to your account",
    icon: peopleOutline,
  },
  trainings: {
    title: "Group Trainings",
    helper: "Recorded training sessions",
    icon: schoolOutline,
  },
  meetings: {
    title: "Meetings",
    helper: "Recorded group meetings",
    icon: listOutline,
  },
  savingsGroup: {
    title: "Aggregated Group Savings",
    helper: "Group savings records",
    icon: cashOutline,
  },
  savingsMember: {
    title: "Aggregated Member Savings",
    helper: "Member savings records",
    icon: cashOutline,
  },
  groupIGAs: {
    title: "Group IGAs",
    helper: "Income generating activity records by group",
    icon: barChartOutline,
  },
  memberIGAs: {
    title: "Member IGAs",
    helper: "Income generating activity records by beneficiary",
    icon: storefrontOutline,
  },
};

const DashboardSummaryDetails: React.FC = () => {
  const history = useHistory();
  const { metricKey } = useParams<Params>();
  const { user } = useAuth();
  const [items, setItems] = useState<SummaryDetailItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const metric = metricConfig[metricKey] || metricConfig.groups;
  const roleId = Number(user?.userRole || 0);
  const countLabel =
    metricKey === "verified" ? "Allocated Members" : "Visible Records";

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await getDashboardMetricItems(metricKey, roleId);
      setItems(rows);
    } catch (error) {
      console.error("Failed to load dashboard summary details:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [metricKey, roleId]);

  useIonViewWillEnter(() => {
    load();
  });

  React.useEffect(() => {
    load();
  }, [load]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => item.searchText.includes(normalized));
  }, [items, query]);

  const totalAmount = useMemo(
    () =>
      metricKey === "savingsGroup" || metricKey === "savingsMember"
        ? filteredItems.reduce((sum, item) => sum + Number(item.amountValue || 0), 0)
        : null,
    [filteredItems, metricKey],
  );

  const totalVisibleCount = useMemo(() => {
    if (metricKey === "verified") {
      return filteredItems.reduce(
        (sum, item) => sum + (Array.isArray(item.members) ? item.members.length : 0),
        0,
      );
    }

    return filteredItems.length;
  }, [filteredItems, metricKey]);

  const { visible, visibleCount, loadMore, resetKey } = useLocalInfiniteScroll({
    items: filteredItems,
    pageSize: 25,
  });

  const groupedVisibleItems = useMemo(
    () => [{ title: "", items: visible }],
    [visible],
  );

  const renderMembers = (item: SummaryDetailItem) => {
    if (!item.members || item.members.length === 0) return null;

    const visibleMembers = item.members.slice(0, 8);
    const hiddenCount = item.members.length - visibleMembers.length;

    return (
      <div className="summary-details-members">
        <span className="summary-details-members-label">Verified Members</span>
        <div className="summary-details-member-list">
          {visibleMembers.map((member) => (
            <div key={`${item.id}-${member}`} className="summary-details-member-pill">
              {member}
            </div>
          ))}
          {hiddenCount > 0 ? (
            <div className="summary-details-member-pill more">
              +{hiddenCount} more
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonButtons slot="start">
            <IonButton onClick={() => history.goBack()} color="light">
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>{metric.title}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="summary-details-page">
        <section className="summary-details-hero">
          <div className="summary-details-hero-icon">
            <IonIcon icon={metric.icon} />
          </div>
          <div className="summary-details-hero-copy">
            <span className="summary-details-kicker">Summary Details</span>
            <h1>{metric.title}</h1>
            <p>{metric.helper}</p>
          </div>
        </section>

        <section className="summary-details-toolbar">
          <IonCard className="summary-details-count-card">
            <IonCardContent>
              <div className="summary-details-count-row">
                <div>
                  <span className="summary-details-count-label">{countLabel}</span>
                  <strong>{totalVisibleCount.toLocaleString()}</strong>
                </div>
                <IonBadge color="success">
                  {query.trim() ? "Filtered" : "All"}
                </IonBadge>
              </div>
              {totalAmount !== null ? (
                <div className="summary-details-amount-row">
                  <span className="summary-details-count-label">Total Amount</span>
                  <strong>{`K ${totalAmount.toLocaleString("en-US")}`}</strong>
                </div>
              ) : null}
              <p>
                Scroll through the results or search to narrow large datasets quickly.
              </p>
              {filteredItems.length > 25 ? (
                <p>
                  Showing {Math.min(visibleCount, filteredItems.length).toLocaleString()} of{" "}
                  {filteredItems.length.toLocaleString()} records. Scroll to load more.
                </p>
              ) : null}
            </IonCardContent>
          </IonCard>

          <IonSearchbar
            value={query}
            debounce={150}
            placeholder={`Search ${metric.title.toLowerCase()}`}
            onIonInput={(e) => setQuery(String(e.detail.value || ""))}
          />
        </section>

        {loading ? (
          <div className="summary-details-loading">
            <IonSpinner name="crescent" />
          </div>
        ) : filteredItems.length === 0 ? (
          <IonCard className="summary-details-empty">
            <IonCardContent>
              <h3>No records found</h3>
              <p>
                {query.trim()
                  ? "Try a different search term."
                  : "No records are available for this metric yet."}
              </p>
            </IonCardContent>
          </IonCard>
        ) : (
          <>
            <IonList className="summary-details-list">
              {groupedVisibleItems.map((group) => (
                <React.Fragment key={group.title || "all"}>
                  {group.title ? (
                    <div className="summary-details-section-title">{group.title}</div>
                  ) : null}
                  {group.items.map((item) => (
                    <IonCard key={item.id} className="summary-details-item-card">
                      <IonCardContent>
                        <div className="summary-details-item-head">
                          <div className="summary-details-item-copy">
                            <h2>{item.title}</h2>
                            <p>{item.subtitle}</p>
                          </div>
                          {item.badge ? (
                            <IonBadge color="light">{item.badge}</IonBadge>
                          ) : null}
                        </div>

                        <div className="summary-details-item-meta">
                          {item.details.map((detail, index) => (
                            <div key={`${item.id}-${index}`} className="summary-details-meta-row">
                              {detail}
                            </div>
                          ))}
                        </div>

                        {renderMembers(item)}
                      </IonCardContent>
                    </IonCard>
                  ))}
                </React.Fragment>
              ))}
            </IonList>

            <IonInfiniteScroll
              key={resetKey}
              threshold="120px"
              onIonInfinite={loadMore}
              disabled={visible.length >= filteredItems.length}
            >
              <IonInfiniteScrollContent
                loadingSpinner="bubbles"
                loadingText="Loading more records..."
              />
            </IonInfiniteScroll>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default DashboardSummaryDetails;
