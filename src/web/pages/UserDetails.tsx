import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGet, apiPatch, apiPost, apiDelete } from "../../services/api";

type Params = { id: string };

type User = {
  id: number;
  username: string;
  email: string | null;
  userRole: string | number | null;
  firstname?: string | null;
  lastname?: string | null;
};

const UserDetails: React.FC = () => {
  const { id } = useParams<Params>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [roles, setRoles] = useState<Array<{ roleid: number; rolename: string }>>([]);
  const [extensions, setExtensions] = useState<Array<{ id: number; regionID: string; userID: number }>>(
    [],
  );
  const [newRegion, setNewRegion] = useState("");
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await apiGet<User>(`/users/${id}`);
        const roleData = await apiGet<Array<{ roleid: number; rolename: string }>>("/user-roles");
        const extData = await apiGet<Array<{ id: number; regionID: string; userID: number }>>(
          `/role-extensions?userID=${encodeURIComponent(id)}`,
        );
        if (!cancelled) {
          setUser(data);
          setRole(String(data.userRole ?? ""));
          setRoles(Array.isArray(roleData) ? roleData : []);
          setExtensions(Array.isArray(extData) ? extData : []);
        }
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

  const save = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      await apiPatch(`/users/${user.id}`, {
        userRole: role,
        newPassword: newPassword || undefined,
      });
      setNewPassword("");
    } catch (e: any) {
      setError(e?.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const addExtension = async () => {
    if (!user || !newRegion.trim()) return;
    try {
      const created = await apiPost<{ id: number; regionID: string; userID: number }>(
        "/role-extensions",
        { userID: user.id, regionID: newRegion.trim() },
      );
      setExtensions((prev) => [created, ...prev]);
      setNewRegion("");
    } catch (e: any) {
      setError(e?.message || "Failed to add extension");
    }
  };

  const removeExtension = async (extId: number) => {
    try {
      await apiDelete(`/role-extensions/${extId}`);
      setExtensions((prev) => prev.filter((e) => e.id !== extId));
    } catch (e: any) {
      setError(e?.message || "Failed to remove extension");
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

  return (
    <div className="app-shell" style={{ maxWidth: 720 }}>
      <Link to="/users" className="muted">
        ← Back
      </Link>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {user && (
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ margin: "0 0 6px" }}>{user.username}</h2>
              <p className="muted" style={{ margin: 0 }}>
                {[user.firstname, user.lastname].filter(Boolean).join(" ") || "—"}
              </p>
            </div>
            <span className="pill">{user.userRole ?? "—"}</span>
          </div>

          <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
            <div>
              <div className="muted">Email</div>
              <div>{user.email || "—"}</div>
            </div>
            <div>
              <label className="muted" style={{ display: "block", marginBottom: 4 }}>
                Role
              </label>
              <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="">Select role</option>
                {roles.map((r) => (
                  <option key={r.roleid} value={r.roleid}>
                    {r.rolename} ({r.roleid})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="muted" style={{ display: "block", marginBottom: 4 }}>
                Set new password (optional)
              </label>
              <input
                type="password"
                className="input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current"
              />
            </div>
            <div>
              <button className="btn" onClick={save} disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>

            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
              <h4 style={{ margin: "0 0 10px" }}>Role extensions (regions)</h4>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input
                  className="input"
                  style={{ flex: 1 }}
                  placeholder="Region ID"
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                />
                <button className="btn" onClick={addExtension} disabled={!newRegion.trim()}>
                  Add
                </button>
              </div>
              {extensions.length === 0 && <p className="muted">No extensions.</p>}
              {extensions.length > 0 && (
                <table className="table">
                  <thead>
                    <tr>
                      <th>RegionID</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {extensions.map((ext) => (
                      <tr key={ext.id}>
                        <td>{ext.regionID}</td>
                        <td>
                          <button
                            className="btn"
                            style={{ background: "#ef4444" }}
                            onClick={() => removeExtension(ext.id)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
              <h4 style={{ margin: "0 0 10px" }}>Password reset</h4>
              <button className="btn" onClick={sendResetEmail} disabled={saving}>
                Send reset email
              </button>
              {resetMessage && <p className="muted" style={{ marginTop: 8 }}>{resetMessage}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetails;
