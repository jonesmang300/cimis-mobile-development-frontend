import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPost } from "../../services/api";

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

type LocationAssignment = {
  key: string;
  regionID: string;
  districtID: string;
  taIDs: string[];
};

const PAGE_SIZE = 10;

const emptyForm = {
  username: "",
  firstname: "",
  lastname: "",
  email: "",
  password: "",
  userRole: "",
};

const createSteps = [
  {
    id: 1,
    title: "Account",
    description: "Enter the user profile, role, and sign-in details.",
  },
  {
    id: 2,
    title: "Extensions",
    description: "Choose any regional role extensions for this user.",
  },
  {
    id: 3,
    title: "Location",
    description: "Assign the user location and review the setup.",
  },
] as const;

const buildLocationKey = (regionID: string, districtID: string, taIDs: string[]) =>
  [regionID, districtID, [...taIDs].sort().join(",")].join("::");

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [locationRegion, setLocationRegion] = useState("");
  const [locationDistrict, setLocationDistrict] = useState("");
  const [locationTas, setLocationTas] = useState<string[]>([]);
  const [locationAssignments, setLocationAssignments] = useState<LocationAssignment[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [tas, setTas] = useState<TA[]>([]);
  const [districtNameMap, setDistrictNameMap] = useState<Record<string, string>>({});
  const [taNameMap, setTaNameMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [userData, roleData, regionData] = await Promise.all([
          apiGet<User[]>("/users"),
          apiGet<Role[]>("/user-roles"),
          apiGet<Region[]>("/regions"),
        ]);

        if (!cancelled) {
          setUsers(Array.isArray(userData) ? userData : []);
          setRoles(Array.isArray(roleData) ? roleData : []);
          setRegions(Array.isArray(regionData) ? regionData : []);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load users");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const roleNameById = useMemo(() => {
    const map: Record<string, string> = {};
    roles.forEach((role) => {
      map[String(role.roleid)] = role.rolename;
    });
    return map;
  }, [roles]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return users;
    return users.filter((u) =>
      [
        u.username,
        u.email,
        u.firstname,
        u.lastname,
        roleNameById[String(u.userRole ?? "")],
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [users, search, roleNameById]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const pagedUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const resetModal = () => {
    setForm(emptyForm);
    setShowPassword(false);
    setCreateStep(1);
    setSelectedRegions([]);
    setLocationRegion("");
    setLocationDistrict("");
    setLocationTas([]);
    setLocationAssignments([]);
    setDistricts([]);
    setTas([]);
    setCreateError(null);
    setShowCreateModal(false);
  };

  const toggleRegion = (regionID: string) => {
    setSelectedRegions((prev) =>
      prev.includes(regionID)
        ? prev.filter((id) => id !== regionID)
        : [...prev, regionID],
    );
  };

  useEffect(() => {
    if (!showCreateModal || !locationRegion) {
      setDistricts([]);
      setLocationDistrict("");
      setTas([]);
      setLocationTas([]);
      return;
    }

    apiGet<District[]>(`/districts?regionID=${encodeURIComponent(locationRegion)}`)
      .then((rows) => setDistricts(Array.isArray(rows) ? rows : []))
      .catch(() => setDistricts([]));
  }, [locationRegion, showCreateModal]);

  useEffect(() => {
    if (!showCreateModal || !locationDistrict) {
      setTas([]);
      setLocationTas([]);
      return;
    }

    apiGet<TA[]>(`/tas?districtID=${encodeURIComponent(locationDistrict)}`)
      .then((rows) => setTas(Array.isArray(rows) ? rows : []))
      .catch(() => setTas([]));
  }, [locationDistrict, showCreateModal]);

  useEffect(() => {
    let cancelled = false;

    const loadAssignmentNames = async () => {
      const regionIds = Array.from(
        new Set(locationAssignments.map((item) => item.regionID).filter(Boolean)),
      );
      const districtIds = Array.from(
        new Set(locationAssignments.map((item) => item.districtID).filter(Boolean)),
      );

      if (regionIds.length === 0 && districtIds.length === 0) {
        if (!cancelled) {
          setDistrictNameMap({});
          setTaNameMap({});
        }
        return;
      }

      const nextDistrictMap: Record<string, string> = {};
      const nextTaMap: Record<string, string> = {};

      await Promise.all(
        regionIds.map(async (regionID) => {
          const rows = await apiGet<District[]>(
            `/districts?regionID=${encodeURIComponent(regionID)}`,
          );
          (Array.isArray(rows) ? rows : []).forEach((row) => {
            const districtID = String(row.DistrictID || "").trim();
            if (districtID) {
              nextDistrictMap[districtID] = row.DistrictName || districtID;
            }
          });
        }),
      );

      await Promise.all(
        districtIds.map(async (districtID) => {
          const rows = await apiGet<TA[]>(
            `/tas?districtID=${encodeURIComponent(districtID)}`,
          );
          (Array.isArray(rows) ? rows : []).forEach((row) => {
            const taID = String(row.TAID || "").trim();
            if (taID) {
              nextTaMap[taID] = row.TAName || taID;
            }
          });
        }),
      );

      if (!cancelled) {
        setDistrictNameMap(nextDistrictMap);
        setTaNameMap(nextTaMap);
      }
    };

    loadAssignmentNames().catch(() => {
      if (!cancelled) {
        setDistrictNameMap({});
        setTaNameMap({});
      }
    });

    return () => {
      cancelled = true;
    };
  }, [locationAssignments]);

  const createUser = async () => {
    if (!form.username.trim() || !form.password.trim() || !form.userRole) {
      setCreateError("Username, password, and role are required.");
      return;
    }

    setCreating(true);
    setCreateError(null);
    setError(null);
    setSuccess(null);

    try {
      const created = await apiPost<{
        id: number;
        username: string;
        email?: string | null;
        userRole?: string | number | null;
        firstname?: string | null;
        lastname?: string | null;
      }>("/users/register", {
        username: form.username.trim(),
        firstname: form.firstname.trim() || null,
        lastname: form.lastname.trim() || null,
        email: form.email.trim() || null,
        password: form.password,
        userRole: form.userRole,
      });

      const createdUserId = Number(created?.id);
      const draftLocationAssignments = [...locationAssignments];
      if (
        locationRegion &&
        locationDistrict &&
        locationTas.length > 0
      ) {
        const key = buildLocationKey(locationRegion, locationDistrict, locationTas);
        if (!draftLocationAssignments.some((item) => item.key === key)) {
          draftLocationAssignments.push({
            key,
            regionID: locationRegion,
            districtID: locationDistrict,
            taIDs: [...locationTas],
          });
        }
      }

      const secondaryFailures: string[] = [];

      if (createdUserId && selectedRegions.length > 0) {
        const extensionResults = await Promise.allSettled(
          selectedRegions.map((regionID) =>
            apiPost("/role-extensions", {
              userID: createdUserId,
              regionID,
            }),
          ),
        );
        if (extensionResults.some((result) => result.status === "rejected")) {
          secondaryFailures.push("some role extensions");
        }
      }

      if (createdUserId && draftLocationAssignments.length > 0) {
        const locationResults = await Promise.allSettled(
          draftLocationAssignments.flatMap((assignment) =>
            assignment.taIDs.map((taID) =>
            apiPost("/user-locations", {
              userID: createdUserId,
                regionID: assignment.regionID || undefined,
                districtID: assignment.districtID || undefined,
              taID: taID || undefined,
              }),
            ),
          ),
        );
        if (locationResults.some((result) => result.status === "rejected")) {
          secondaryFailures.push("some user locations");
        }
      }

      const newUser: User = {
        id: createdUserId,
        username: created?.username || form.username.trim(),
        email: created?.email ?? (form.email.trim() || null),
        userRole: created?.userRole ?? form.userRole,
        firstname: created?.firstname ?? (form.firstname.trim() || null),
        lastname: created?.lastname ?? (form.lastname.trim() || null),
      };

      setUsers((prev) => [newUser, ...prev]);
      resetModal();
      setSuccess("User account created successfully.");

      if (secondaryFailures.length > 0) {
        setError(
          `User account was created, but ${secondaryFailures.join(" and ")} could not be saved.`,
        );
      }
    } catch (e: any) {
      setCreateError(e?.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const nextStep = () => {
    if (createStep === 1 && (!form.username.trim() || !form.password.trim() || !form.userRole)) {
      setCreateError("Username, password, and role are required before continuing.");
      return;
    }

    setCreateError(null);
    setCreateStep((prev) => Math.min(createSteps.length, prev + 1));
  };

  const previousStep = () => {
    setCreateError(null);
    setCreateStep((prev) => Math.max(1, prev - 1));
  };

  const toggleTa = (taID: string) => {
    setLocationTas((prev) =>
      prev.includes(taID) ? prev.filter((id) => id !== taID) : [...prev, taID],
    );
  };

  const addLocationAssignment = () => {
    if (!locationRegion || !locationDistrict || locationTas.length === 0) {
      setCreateError("Select a region, district, and at least one TA before adding a location.");
      return;
    }

    const key = buildLocationKey(locationRegion, locationDistrict, locationTas);
    setLocationAssignments((prev) =>
      prev.some((item) => item.key === key)
        ? prev
        : [
            ...prev,
            {
              key,
              regionID: locationRegion,
              districtID: locationDistrict,
              taIDs: [...locationTas],
            },
          ],
    );
    setCreateError(null);
    setLocationTas([]);
  };

  const removeLocationAssignment = (key: string) => {
    setLocationAssignments((prev) => prev.filter((item) => item.key !== key));
  };

  const selectedRoleName =
    roleNameById[String(form.userRole || "")] || roles.find((role) => String(role.roleid) === String(form.userRole))?.rolename || "Not selected";
  const selectedRegionNames = regions
    .filter((region) => selectedRegions.includes(region.regionID))
    .map((region) => region.name);
  const locationAssignmentLabels = locationAssignments.map((assignment) => {
    const regionName =
      regions.find((region) => region.regionID === assignment.regionID)?.name ||
      assignment.regionID;
    const districtName =
      districtNameMap[assignment.districtID] ||
      districts.find((district) => district.DistrictID === assignment.districtID)?.DistrictName ||
      assignment.districtID;
    const taNames = assignment.taIDs
      .map((taID) => taNameMap[taID] || tas.find((ta) => ta.TAID === taID)?.TAName || taID)
      .join(", ");
    return `${regionName} / ${districtName} / ${taNames}`;
  });

  return (
    <div className="app-shell">
      <div className="card">
        <div className="toolbar-row">
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>
              Users
            </h2>
            <p className="muted" style={{ margin: 0 }}>
              Manage accounts, roles, and regional extensions.
            </p>
          </div>
          <div className="toolbar-actions">
            <input
              className="input"
              style={{ maxWidth: 260 }}
              placeholder="Search name, email, username"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn" onClick={() => setShowCreateModal(true)}>
              Add User
            </button>
          </div>
        </div>

        {loading && <p>Loading...</p>}
        {error && <div className="alert-banner alert-error">{error}</div>}
        {success && <div className="alert-banner alert-success">{success}</div>}
        {!loading && filtered.length === 0 && !error && <p>No users found.</p>}

        {filtered.length > 0 && (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pagedUsers.map((u) => (
                  <tr key={u.id}>
                    <td>{u.username}</td>
                    <td>{[u.firstname, u.lastname].filter(Boolean).join(" ") || "-"}</td>
                    <td>{u.email || "-"}</td>
                    <td>
                      <span className="pill">
                        {roleNameById[String(u.userRole ?? "")] || u.userRole || "-"}
                      </span>
                    </td>
                    <td>
                      <Link to={`/users/${u.id}`} style={{ fontWeight: 600 }}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pagination-row">
              <span className="muted">
                Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length}
              </span>
              <div className="pagination-actions">
                <button
                  className="btn btn-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </button>
                <span className="pill">
                  Page {page} / {totalPages}
                </span>
                <button
                  className="btn btn-secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-backdrop" onClick={resetModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3 style={{ margin: 0 }}>Create User</h3>
                <p className="muted" style={{ margin: "6px 0 0" }}>
                  Add the user account in guided steps, then assign extensions and location.
                </p>
              </div>
              <button className="btn btn-secondary" onClick={resetModal}>
                Close
              </button>
            </div>

            {createError && <div className="alert-banner alert-error">{createError}</div>}

            <div className="stepper">
              {createSteps.map((step) => {
                const isActive = step.id === createStep;
                const isDone = step.id < createStep;
                return (
                  <div
                    key={step.id}
                    className={`step-item${isActive ? " is-active" : ""}${isDone ? " is-done" : ""}`}
                  >
                    <div className="step-badge">{step.id}</div>
                    <div>
                      <div className="step-title">{step.title}</div>
                      <div className="step-copy">{step.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {createStep === 1 && (
              <div className="step-panel">
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
                    <label className="muted form-label">Password</label>
                    <div className="password-field">
                      <input
                        className="input"
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, password: e.target.value }))
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
              </div>
            )}

            {createStep === 2 && (
              <div className="step-panel">
                <div className="extension-block step-block">
                  <h4 style={{ margin: "0 0 8px" }}>Role Extensions</h4>
                  <p className="muted" style={{ marginTop: 0 }}>
                    Select any regions that should be attached to this user.
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
              </div>
            )}

            {createStep === 3 && (
              <div className="step-panel">
                <div className="extension-block step-block">
                  <h4 style={{ margin: "0 0 8px" }}>User Location</h4>
                  <p className="muted" style={{ marginTop: 0 }}>
                    Assign one or more TA-based locations for this user.
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
                  <div className="modal-actions" style={{ justifyContent: "flex-start", marginTop: 14 }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={addLocationAssignment}
                      disabled={!locationDistrict || locationTas.length === 0}
                    >
                      Add location assignment
                    </button>
                  </div>
                  <div className="assignment-list">
                    {locationAssignments.length === 0 ? (
                      <p className="muted" style={{ margin: 0 }}>
                        No saved location assignments yet.
                      </p>
                    ) : (
                      locationAssignments.map((assignment) => {
                        const regionName =
                          regions.find((region) => region.regionID === assignment.regionID)?.name ||
                          assignment.regionID;
                        const districtName =
                          districtNameMap[assignment.districtID] ||
                          districts.find((district) => district.DistrictID === assignment.districtID)
                            ?.DistrictName || assignment.districtID;
                        const taNames = assignment.taIDs
                          .map((taID) => taNameMap[taID] || tas.find((ta) => ta.TAID === taID)?.TAName || taID)
                          .join(", ");

                        return (
                          <div key={assignment.key} className="assignment-card">
                            <div>
                              <strong>{districtName}</strong>
                              <div className="muted">{regionName}</div>
                              <div>{taNames}</div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => removeLocationAssignment(assignment.key)}
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="review-card">
                  <h4 style={{ margin: "0 0 8px" }}>Review</h4>
                  <div className="review-grid">
                    <div>
                      <span className="muted review-label">Account</span>
                      <strong>{form.username || "Not entered"}</strong>
                      <span>{[form.firstname, form.lastname].filter(Boolean).join(" ") || "No name provided"}</span>
                    </div>
                    <div>
                      <span className="muted review-label">Role</span>
                      <strong>{selectedRoleName}</strong>
                      <span>{form.email || "No email provided"}</span>
                    </div>
                    <div>
                      <span className="muted review-label">Extensions</span>
                      <strong>{selectedRegionNames.length} selected</strong>
                      <span>{selectedRegionNames.join(", ") || "No region extensions selected"}</span>
                    </div>
                    <div>
                      <span className="muted review-label">Location</span>
                      <strong>
                        {locationAssignments.reduce((sum, assignment) => sum + assignment.taIDs.length, 0) || 0} TA(s)
                      </strong>
                      <span>
                        {locationAssignmentLabels.join(" | ") || "No location assigned"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={resetModal} disabled={creating}>
                Cancel
              </button>
              {createStep > 1 && (
                <button className="btn btn-secondary" onClick={previousStep} disabled={creating}>
                  Back
                </button>
              )}
              {createStep < createSteps.length ? (
                <button className="btn" onClick={nextStep} disabled={creating}>
                  Next
                </button>
              ) : (
                <button className="btn" onClick={createUser} disabled={creating}>
                  {creating ? "Creating..." : "Create User"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
