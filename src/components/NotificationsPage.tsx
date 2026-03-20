import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToast,
  IonToolbar,
} from "@ionic/react";
import { arrowBack, refreshOutline, syncOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import {
  listSyncQueueItems,
  subscribeQueueCount,
  subscribeSyncUpdates,
  syncSelectedQueueItems,
  SyncQueueItem,
} from "../data/sync";

const formatDateTime = (value: number) => {
  if (!value) return "Unknown time";

  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "Unknown time";
  }
};

const NotificationsPage: React.FC = () => {
  const history = useHistory();
  const [items, setItems] = useState<SyncQueueItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const nextItems = await listSyncQueueItems();
      setItems(nextItems);
      setSelectedIds(nextItems.map((item) => item.id));
    } catch (error) {
      console.error("Failed to load sync notifications", error);
      setToastMessage("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    const unsubscribe = subscribeQueueCount(() => {
      loadItems();
    });
    const unsubscribeSync = subscribeSyncUpdates(() => {
      loadItems();
    });
    return () => {
      unsubscribe();
      unsubscribeSync();
    };
  }, [loadItems]);

  const allSelected =
    items.length > 0 && items.every((item) => selectedIds.includes(item.id));

  const selectedCount = selectedIds.length;

  const pendingCount = useMemo(
    () => items.filter((item) => item.status !== "failed").length,
    [items],
  );

  const failedCount = useMemo(
    () => items.filter((item) => item.status === "failed").length,
    [items],
  );

  const toggleOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        return Array.from(new Set([...prev, id]));
      }
      return prev.filter((entry) => entry !== id);
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? items.map((item) => item.id) : []);
  };

  const handleSyncSelected = async () => {
    if (selectedIds.length === 0) {
      setToastMessage("Select at least one item to sync");
      return;
    }

    try {
      setSyncing(true);
      const result = await syncSelectedQueueItems(selectedIds);
      await loadItems();

      if (result.failed.length > 0) {
        setToastMessage(
          result.syncedCount > 0
            ? `${result.syncedCount} item(s) synced. ${result.failed.length} failed.`
            : result.failed[0],
        );
        return;
      }

      setToastMessage(`${result.syncedCount} item(s) synced successfully`);
    } catch (error) {
      console.error("Manual sync failed", error);
      setToastMessage(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
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
          <IonTitle>Notifications</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => loadItems()} color="light">
              <IonIcon icon={refreshOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonItem lines="none">
          <IonLabel>
            <h2>Sync Inbox</h2>
            <p>Select the items you want to sync manually.</p>
          </IonLabel>
        </IonItem>

        <IonItem lines="none">
          <IonCheckbox
            slot="start"
            checked={allSelected}
            onIonChange={(e) => toggleAll(e.detail.checked)}
          />
          <IonLabel>Select all queued items</IonLabel>
          <IonBadge slot="end" color="success">
            {selectedCount}
          </IonBadge>
        </IonItem>

        <IonItem lines="none">
          <IonLabel>
            <p>{pendingCount} queued</p>
            <p>{failedCount} failed</p>
          </IonLabel>
        </IonItem>

        <IonButton
          expand="block"
          color="success"
          onClick={handleSyncSelected}
          disabled={syncing || items.length === 0}
        >
          {syncing ? (
            <>
              <IonSpinner name="crescent" style={{ marginRight: 8 }} />
              Syncing selected...
            </>
          ) : (
            <>
              <IonIcon icon={syncOutline} slot="start" />
              Sync selected
            </>
          )}
        </IonButton>

        {loading ? (
          <div style={{ textAlign: "center", paddingTop: 24 }}>
            <IonSpinner name="crescent" />
          </div>
        ) : items.length === 0 ? (
          <IonItem lines="none">
            <IonLabel color="medium">No pending notifications to sync</IonLabel>
          </IonItem>
        ) : (
          <IonList>
            {items.map((item) => (
              <IonItem key={item.id}>
                <IonCheckbox
                  slot="start"
                  checked={selectedIds.includes(item.id)}
                  onIonChange={(e) => toggleOne(item.id, e.detail.checked)}
                />
                <IonLabel>
                  <h2>{item.title}</h2>
                  <p>{item.detail}</p>
                  <p>{formatDateTime(item.createdAt)}</p>
                </IonLabel>
                <IonBadge
                  slot="end"
                  color={
                    item.status === "failed"
                      ? "danger"
                      : item.status === "creating"
                      ? "warning"
                      : "medium"
                  }
                >
                  {item.status}
                </IonBadge>
              </IonItem>
            ))}
          </IonList>
        )}

        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage}
          duration={3500}
          onDidDismiss={() => setToastMessage("")}
        />
      </IonContent>
    </IonPage>
  );
};

export default NotificationsPage;
