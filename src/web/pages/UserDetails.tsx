import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiDelete, apiGet, apiPatch, apiPost } from "../../services/api";

type Params = { id: string };

type User = {
  id: number;
  username: string;
  email: string | null;
  userRole: string | number | null;
  firstname?: string | null;
  lastname?: string | null;
};

type Role = {
  roleid: number;
  rolename: string;
};

type Region = {
  regionID: string;
  name: string;
};

type District = {
  DistrictID: string;
  DistrictName: string;
};

type TA = {
  TAID: string;
  TAName: string;
};

type RoleExtension = {
  id: number;
  regionID: string;
  userID: number;
};

type UserLocation = {
  id: number;
  userID: number;
  regionID?: string | null;
  districtID?: string | null;
  taID?: string | null;
};

const UserDetails: React.FC = () => {
  const { id } = useParams<Params>();
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [tas, setTas] = useState<TA[]>([]);
  const [districtNameMap, setDistrictNameMap] = useState<Record<string, string>>({});
  const [taNameMap, setTaNameMap] = useState<Record<string, string>>({});
  const [extensions, setExtensions] = useState<RoleExtension[]>([]);
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    username: "",
    email: "",
    firstname: "",
    lastname: "",
    userRole: "",
    newPassword: "",
  });

  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [locationRegion, setLocationRegion] = useState("");
  const [locationDistrict, setLocationDistrict] = useState("");
  const [locationTas, setLocationTas] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);

      try {
        const [userData, roleData, regionData, extensionData, locationData] =
          await Promise.all([
            apiGet<User>(`/users/${id}`),
            apiGet<Role[]>("/user-roles"),
            apiGet<Region[]>("/regions"),
            apiGet<RoleExtension[]>(`/role-extensions?userID=${encodeURIComponent(id)}`),
            apiGet<UserLocation[]>(`/user-locations?userID=${encodeURIComponent(id)}`),
          ]);

        if (cancelled) return;

        setUser(userData);
        setRoles(Array.isArray(roleData) ? roleData : []);
        setRegions(Array.isArray(regionData) ? regionData : []);
        setExtensions(Array.isArray(extensionData) ? extensionData : []);
        setLocations(Array.isArray(locationData) ? locationData : []);
        setSelectedRegions(
          (Array.isArray(extensionData) ? extensionData : []).map((row) =>
            String(row.regionID || "").trim(),
          ),
        );
        setForm({
          username: String(userData?.username || ""),
          email: String(userData?.email || ""),
          firstname: String(userData?.firstname || ""),
          lastname: String(userData?.lastname || ""),
          userRole: String(userData?.userRole || ""),
          newPassword: "",
        });

        const locationRows = Array.isArray(locationData) ? locationData : [];
        const locationRegionIds = Array.from(
          new Set(
            locationRows
              .map((row) => String(row.regionID || "").trim())
              .filter(Boolean),
          ),
        );
        const districtMap: Record<string, string> = {};
        const taMap: Record<string, string> = {};

        await Promise.all(
          locationRegionIds.map(async (regionID) => {
            const districtRows = await apiGet<District[]>(
              `/districts?regionID=${encodeURIComponent(regionID)}`,
            );
            (Array.isArray(districtRows) ? districtRows : []).forEach((row) => {
              const districtID = String(row.DistrictID || "").trim();
              if (districtID) {
                districtMap[districtID] = row.DistrictName || districtID;
              }
            });
          }),
        );

        await Promise.all(
          Array.from(
            new Set(
              locationRows
                .map((row) => String(row.districtID || "").trim())
                .filter(Boolean),
            ),
          ).map(async (districtID) => {
            const taRows = await apiGet<TA[]>(
              `/tas?districtID=${encodeURIComponent(districtID)}`,
            );
            (Array.isArray(taRows) ? taRows : []).forEach((row) => {
              const taID = String(row.TAID || "").trim();
              if (taID) {
                taMap[taID] = row.TAName || taID;
              }
            });
          }),
        );

        setDistrictNameMap(districtMap);
        setTaNameMap(taMap);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load user");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!locationRegion) {
      setDistricts([]);
      setLocationDistrict("");
      setTas([]);
      setLocationTas([]);
      return;
    }

    apiGet<District[]>(`/districts?regionID=${encodeURIComponent(locationRegion)}`)
      .then((rows) => setDistricts(Array.isArray(rows) ? rows : []))
      .catch(() => setDistricts([]));
  }, [locationRegion]);

  useEffect(() => {
    if (!locationDistrict) {
      setTas([]);
      setLocationTas([]);
      return;
    }

    apiGet<TA[]>(`/tas?districtID=${encodeURIComponent(locationDistrict)}`)
      .then((rows) => setTas(Array.isArray(rows) ? rows : []))
      .catch(() => setTas([]));
  }, [locationDistrict]);

  const roleNameById = useMemo(() => {
    const map: Record<string, string> = {};
    roles.forEach((role) => {
      map[String(role.roleid)] = role.rolename;
    });
    return map;
  }, [roles]);

  const toggleRegion = (regionID: string) => {
    setSelectedRegions((prev) =>
      prev.includes(regionID)
        ? prev.filter((id) => id !== regionID)
        : [...prev, regionID],
    );
  };

  const toggleTa = (taID: string) => {
    setLocationTas((prev) =>
      prev.includes(taID) ? prev.filter((id) => id !== taID) : [...prev, taID],
    );
  };

  const syncExtensions = async (userID: number) => {
    const currentMap = new Map(
      extensions.map((item) => [String(item.regionID || "").trim(), item]),
    );
    const nextSet = new Set(selectedRegions);

    const toCreate = selectedRegions.filter((regionID) => !currentMap.has(regionID));
    const toDelete = extensions.filter((item) => !nextSet.has(String(item.regionID || "").trim()));

    const createResults = await Promise.allSettled(
      toCreate.map((regionID) => apiPost("/role-extensions", { userID, regionID })),
    );
    const deleteResults = await Promise.allSettled(
      toDelete.map((item) => apiDelete(`/role-extensions/${item.id}`)),
    );

    if (
      createResults.some((result) => result.status === "rejected") ||
      deleteResults.some((result) => result.status === "rejected")
    ) {
      throw new Error("Some role extensions could not be updated");
    }
  };

  const save = async () => {
    if (!user) return;

    if (!form.username.trim() || !form.userRole) {
      setError("Username and role are required.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await apiPatch(`/users/${user.id}`, {
        username: form.username.trim(),
        email: form.email.trim() || null,
        firstname: form.firstname.trim() || null,
        lastname: form.lastname.trim() || null,
        userRole: form.userRole,
        newPassword: form.newPassword.trim() || undefined,
      });

      await syncExtensions(user.id);

      setUser((prev) =>
        prev
          ? {
              ...prev,
              username: form.username.trim(),
              email: form.email.trim() || null,
              firstname: form.firstname.trim() || null,
              lastname: form.lastname.trim() || null,
              userRole: form.userRole,
            }
          : prev,
      );
      setForm((prev) => ({ ...prev, newPassword: "" }));

      const [extensionData, locationData] = await Promise.all([
        apiGet<RoleExtension[]>(`/role-extensions?userID=${encodeURIComponent(String(user.id))}`),
        apiGet<UserLocation[]>(`/user-locations?userID=${encodeURIComponent(String(user.id))}`),
      ]);
      setExtensions(Array.isArray(extensionData) ? extensionData : []);
      setLocations(Array.isArray(locationData) ? locationData : []);
      setSuccess("User details updated.");
    } catch (e: any) {
      setError(e?.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const addLocations = async () => {
    if (!user) return;
    if (!locationRegion || !locationDistrict || locationTas.length === 0) {
      setError("Select a region, district, and at least one TA.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const existingTaIds = new Set(
        locations.map((row) => String(row.taID || "").trim()).filter(Boolean),
      );
      const taTargets = locationTas.filter((taID) => !existingTaIds.has(taID));

      if (taTargets.length === 0) {
        setError("Those TA locations are already assigned to this user.");
        return;
      }

      const results = await Promise.allSettled(
        taTargets.map((taID) =>
          apiPost<UserLocation>("/user-locations", {
            userID: user.id,
            regionID: locationRegion,
            districtID: locationDistrict,
            taID,
          }),
        ),
      );

      const createdRows = results
        .filter((result): result is PromiseFulfilledResult<UserLocation> => result.status === "fulfilled")
        .map((result) => result.value);

      if (createdRows.length > 0) {
        setLocations((prev) => [...createdRows, ...prev]);
      }

      if (results.some((result) => result.status === "rejected")) {
        setError("Some TA locations could not be added.");
      } else {
        setSuccess("User locations updated.");
      }

      setLocationTas([]);
    } catch (e: any) {
      setError(e?.message || "Failed to add locations");
    } finally {
      setSaving(false);
    }
  };

  const removeLocation = async (locationId: number) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await apiDelete(`/user-locations/${locationId}`);
      setLocations((prev) => prev.filter((row) => row.id !== locationId));
      setSuccess("Location removed.");
    } catch (e: any) {
      setError(e?.message || "Failed to remove location");
    } finally {
      setSaving(false);
    }
  };

  const sendResetEmail = async () => {
    if (!user) return;
    setResetMessage(null);
    setError(null);
    try {
      await apiPost("/users/forgot-password", {
        email: user.email,
        username: user.username,
      });
      setResetMessage("If the account exists, a reset link has been sent.");
    } catch (e: any) {
      setError(e?.message || "Failed to start reset");
    }
  };

  const resolveRegionName = (regionID?: string | null) =>
    regions.find((row) => String(row.regionID || "").trim() === String(regionID || "").trim())?.name ||
    String(regionID || "-");

  const resolveDistrictName = (districtID?: string | null) =>
    districtNameMap[String(districtID || "").trim()] ||
    districts.find((row) => String(row.DistrictID || "").trim() === String(districtID || "").trim())
      ?.DistrictName ||
    String(districtID || "-");

  const resolveTaName = (taID?: string | null) =>
    taNameMap[String(taID || "").trim()] ||
    tas.find((row) => String(row.TAID || "").trim() === String(taID || "").trim())?.TAName ||
    String(taID || "-");

  return (
    <div className="app-shell" style={{ maxWidth: 960 }}>
      <Link to="/users" className="muted">
        Back
      </Link>

      {loading && <p>Loading...</p>}
      {error && <div className="alert-banner alert-error">{error}</div>}
      {success && <div className="alert-banner alert-success">{success}</div>}

      {user && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="toolbar-row">
            <div>
              <h2 className="section-title" style={{ margin: 0 }}>
                Edit User
              </h2>
              <p className="muted" style={{ margin: "6px 0 0" }}>
                Update the account, role extensions, and TA-based locations.
              </p>
            </div>
            <span className="pill">
              {roleNameById[String(form.userRole || user.userRole || "")] ||
                user.userRole ||
                "-"}
            </span>
          </div>

          <div className="extension-block step-block">
            <h4 style={{ margin: "0 0 10px" }}>Account</h4>
            <div className="form-grid">
              <div>
                <label className="muted form-label">Username</label>
                <input
                  className="input"
                  value={form.username}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, username: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="muted form-label">Email</label>
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="muted form-label">First Name</label>
                <input
                  className="input"
                  value={form.firstname}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, firstname: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="muted form-label">Last Name</label>
                <input
                  className="input"
                  value={form.lastname}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, lastname: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="muted form-label">Role</label>
                <select
                  className="input"
                  value={form.userRole}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, userRole: e.target.value }))
                  }
                >
                  <option value="">Select role</option>
                  {roles.map((role) => (
                    <option key={role.roleid} value={role.roleid}>
                      {role.rolename}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="muted form-label">New Password</label>
                <div className="password-field">
                  <input
                    className="input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Leave blank to keep current password"
                    value={form.newPassword}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, newPassword: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    className="btn btn-secondary password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? "Hide" : "View"}
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={save} disabled={saving}>
                {saving ? "Saving..." : "Save User"}
              </button>
            </div>
          </div>

          <div className="extension-block">
            <h4 style={{ margin: "0 0 8px" }}>Role Extensions</h4>
            <p className="muted" style={{ marginTop: 0 }}>
              Select all regions this user should have access to, then save.
            </p>
            <div className="region-grid">
              {regions.map((region) => (
                <label key={region.regionID} className="check-card">
                  <input
                    type="checkbox"
                    checked={selectedRegions.includes(region.regionID)}
                    onChange={() => toggleRegion(region.regionID)}
                  />
                  <span>{region.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="extension-block">
            <h4 style={{ margin: "0 0 8px" }}>User Locations</h4>
            <p className="muted" style={{ marginTop: 0 }}>
              Assign one or more TA locations to this user.
            </p>

            <div className="form-grid">
              <div>
                <label className="muted form-label">Region</label>
                <select
                  className="input"
                  value={locationRegion}
                  onChange={(e) => setLocationRegion(e.target.value)}
                >
                  <option value="">Select region</option>
                  {regions.map((region) => (
                    <option key={region.regionID} value={region.regionID}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="muted form-label">District</label>
                <select
                  className="input"
                  value={locationDistrict}
                  disabled={!locationRegion}
                  onChange={(e) => setLocationDistrict(e.target.value)}
                >
                  <option value="">Select district</option>
                  {districts.map((district) => (
                    <option key={district.DistrictID} value={district.DistrictID}>
                      {district.DistrictName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="muted form-label">TAs</label>
                <div className={`multi-select-card${!locationDistrict ? " is-disabled" : ""}`}>
                  {tas.length === 0 ? (
                    <span className="muted">
                      {locationDistrict ? "No TAs found for this district." : "Select a district first."}
                    </span>
                  ) : (
                    <div className="region-grid">
                      {tas.map((ta) => (
                        <label key={ta.TAID} className="check-card">
                          <input
                            type="checkbox"
                            checked={locationTas.includes(ta.TAID)}
                            disabled={!locationDistrict}
                            onChange={() => toggleTa(ta.TAID)}
                          />
                          <span>{ta.TAName}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={addLocations} disabled={saving}>
                Add Selected TAs
              </button>
            </div>

            <div className="assignment-list">
              {locations.length === 0 ? (
                <p className="muted" style={{ margin: 0 }}>
                  No locations assigned.
                </p>
              ) : (
                locations.map((location) => (
                  <div key={location.id} className="assignment-card">
                    <div>
                      <strong>{resolveTaName(location.taID)}</strong>
                      <div className="muted">
                        {resolveRegionName(location.regionID)} / {resolveDistrictName(location.districtID)}
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary"
                      onClick={() => removeLocation(location.id)}
                      disabled={saving}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="extension-block">
            <h4 style={{ margin: "0 0 8px" }}>Password Reset</h4>
            <button className="btn btn-secondary" onClick={sendResetEmail} disabled={saving}>
              Send reset email
            </button>
            {resetMessage && (
              <p className="muted" style={{ marginTop: 8 }}>
                {resetMessage}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetails;
