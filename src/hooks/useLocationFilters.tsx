import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

import {
  getRegions,
  getDistricts,
  getVillageClusters,
} from "../db/sqlite";

import { apiGet } from "../services/api";

const isNative = Capacitor.getPlatform() !== "web";

export const useLocationFilters = () => {
  const [regions, setRegions] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [tas, setTas] = useState<any[]>([]);
  const [vcs, setVcs] = useState<any[]>([]);

  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [ta, setTa] = useState("");
  const [vc, setVc] = useState("");

  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingTas, setLoadingTas] = useState(false);
  const [loadingVcs, setLoadingVcs] = useState(false);

  /* ===============================
     REGIONS
  ================================ */
  useEffect(() => {
    const load = async () => {
      setLoadingRegions(true);
      try {
        if (isNative) {
          const res = await getRegions();
          setRegions(res.values || []);
        } else {
          setRegions(await apiGet<any[]>("/regions"));
        }
      } finally {
        setLoadingRegions(false);
      }
    };

    load();
  }, []);

  /* ===============================
     DISTRICTS
  ================================ */
  useEffect(() => {
    if (!region) return;

    setDistrict("");
    setTa("");
    setVc("");
    setDistricts([]);
    setTas([]);
    setVcs([]);

    const load = async () => {
      setLoadingDistricts(true);
      try {
        if (isNative) {
          const res = await getDistricts(region);
          setDistricts(res.values || []);
        } else {
          setDistricts(await apiGet<any[]>(`/districts?regionID=${region}`));
        }
      } finally {
        setLoadingDistricts(false);
      }
    };

    load();
  }, [region]);

  /* ===============================
     TAS
  ================================ */
  useEffect(() => {
    if (!district) return;

    setTa("");
    setVc("");
    setTas([]);
    setVcs([]);

    const load = async () => {
      setLoadingTas(true);
      try {
        setTas(await apiGet<any[]>(`/tas?districtID=${district}`));
      } finally {
        setLoadingTas(false);
      }
    };

    load();
  }, [district]);

  /* ===============================
     VILLAGE CLUSTERS
  ================================ */
  useEffect(() => {
    if (!ta) return;

    setVc("");
    setVcs([]);

    const load = async () => {
      setLoadingVcs(true);
      try {
        if (isNative) {
          const res = await getVillageClusters(ta);
          setVcs(res.values || []);
        } else {
          setVcs(await apiGet<any[]>(`/village-clusters?taID=${ta}`));
        }
      } finally {
        setLoadingVcs(false);
      }
    };

    load();
  }, [ta]);

  return {
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

    loadingRegions,
    loadingDistricts,
    loadingTas,
    loadingVcs,

    isFilterLoading:
      loadingRegions || loadingDistricts || loadingTas || loadingVcs,
  };
};
