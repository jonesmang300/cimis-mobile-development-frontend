import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiPost } from "../../services/api";

const ResetPassword: React.FC = () => {
  const location = useLocation();
  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const token = params.get("token") || "";
  const email = params.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async () => {
    if (!token || !email) {
      setError("This reset link is incomplete. Request a new password reset email.");
      return;
    }

    if (!password.trim()) {
      setError("Enter a new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiPost<{ message?: string }>("/users/reset-password", {
        token,
        email,
        password,
      });
      setSuccess(response?.message || "Password reset successful.");
      setPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      setError(e?.message || "Failed to reset password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell" style={{ maxWidth: 520 }}>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Reset Password</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Set a new password for <strong>{email || "your account"}</strong>.
        </p>

        {error && <div className="alert-banner alert-error">{error}</div>}
        {success && <div className="alert-banner alert-success">{success}</div>}

        <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
          <div>
            <label className="muted form-label">New Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="muted form-label">Confirm Password</label>
            <input
              className="input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-actions" style={{ justifyContent: "space-between" }}>
          <Link to="/" className="muted">
            Back to home
          </Link>
          <button className="btn" onClick={submit} disabled={submitting}>
            {submitting ? "Resetting..." : "Reset Password"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
