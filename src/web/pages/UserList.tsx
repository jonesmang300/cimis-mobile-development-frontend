import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../services/api";
import { isOnline } from "../../plugins/network";

type User = {
  id: number;
  username: string;
  email: string | null;
  userRole: string | number | null;
  firstname?: string | null;
  lastname?: string | null;
};

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiGet<User[]>("/users");
        if (!cancelled) {
          setUsers(Array.isArray(data) ? data : []);
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

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return users;
    return users.filter((u) =>
      [u.username, u.email, u.firstname, u.lastname]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [users, search]);

  const exportCsv = async () => {
    setExporting(true);
    setError(null);
    try {
      const online = await isOnline().catch(() => false);
      if (!online) {
        throw new Error("Go online to export the report");
      }

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch("https://comsip.cloud/api/users/report", {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "users.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message || "Failed to export");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>
              Users
            </h2>
            <p className="muted" style={{ margin: 0 }}>
              Manage accounts, roles, and credentials.
            </p>
          </div>
          <input
            className="input"
            style={{ maxWidth: 260 }}
            placeholder="Search name, email, username"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
          <button className="btn" onClick={exportCsv} disabled={exporting}>
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>

        {loading && <p>Loading…</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {!loading && filtered.length === 0 && !error && <p>No users found.</p>}

        {filtered.length > 0 && (
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
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{[u.firstname, u.lastname].filter(Boolean).join(" ") || "—"}</td>
                  <td>{u.email || "—"}</td>
                  <td>
                    <span className="pill">{u.userRole ?? "—"}</span>
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
        )}
      </div>
    </div>
  );
};

export default UserList;
