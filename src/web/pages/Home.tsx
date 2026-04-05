import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useHistory } from "react-router-dom";
import {
  barChartOutline,
  cashOutline,
  checkmarkCircleOutline,
  listOutline,
  peopleOutline,
  pieChartOutline,
  schoolOutline,
  storefrontOutline,
} from "ionicons/icons";
import { useAuth } from "../../components/context/AuthContext";
import DashboardStatCard from "../../components/DashBoard/DashboardStatCard";
import { DashboardOverview, getDashboardOverview } from "../../services/dashboard.service";
import "../../components/DashBoard/Dashboard.css";

const quickLinks = [
  {
    title: "Group Formation",
    description:
      "Create groups and assign beneficiaries using the same flow already used in the mobile app.",
    to: "/validation",
    cta: "Open formation",
  },
  {
    title: "Group Operations",
    description:
      "Select a group, then manage beneficiaries, savings, trainings, meetings, and IGAs from one place.",
    to: "/groups",
    cta: "Open groups",
  },
  {
    title: "User Management",
    description:
      "Maintain users, roles, and browser-side administration without leaving the web workspace.",
    to: "/users",
    cta: "Open users",
  },
] as const;

const emptyOverview: DashboardOverview = {
  totalVerified: 0,
  myVerified: 0,
  groupsFormed: 0,
  trainings: 0,
  meetings: 0,
  aggregatedGroupSavings: 0,
  aggregatedMemberSavings: 0,
  aggregatedSavings: 0,
  groupIGAs: 0,
  memberIGAs: 0,
};

const formatCurrency = (value: number) => `K ${Number(value || 0).toLocaleString("en-US")}`;
const Home: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth();
  const [overview, setOverview] = useState<DashboardOverview>(emptyOverview);
  const [loading, setLoading] = useState(false);
  const displayName =
    `${String(user?.firstname || "").trim()} ${String(user?.lastname || "").trim()}`.trim() ||
    String(user?.username || "CIMIS User");
  const roleId = Number(user?.userRole || 0);

  const groupSummaryLabel =
    roleId === 5 ? "Groups in your TA scope" : "All groups formed";

  const heroCaption = useMemo(() => {
    if (roleId === 5) {
      return "Your dashboard summary across the TAs assigned to your account for verified members, groups, trainings, meetings, savings, and IGAs.";
    }
    if (roleId === 2) {
      return "Regional summary across your assigned regions for verified members, groups, trainings, meetings, savings, and IGAs.";
    }
    if (roleId === 1) {
      return "System-wide summary across all groups, trainings, meetings, savings, and IGAs.";
    }
    return "Operational summary for verified members, groups, trainings, meetings, savings, and IGAs.";
  }, [roleId]);

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true);
      const nextOverview = await getDashboardOverview(roleId);
      setOverview(nextOverview);
    } catch (error) {
      console.error("Web dashboard load failed:", error);
      setOverview(emptyOverview);
    } finally {
      setLoading(false);
    }
  }, [roleId]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  return (
    <div className="app-shell web-home">
      <section className="web-home__hero">
        <div>
          <span className="web-home__kicker">COMSIP Operations</span>
          <h1>{displayName}</h1>
          <p>{heroCaption}</p>
        </div>
        <div className="web-home__summary card">
          <div className="dashboard-hero-panel">
            <div className="dashboard-hero-metric">
              <span>Members Allocated to Groups</span>
              <strong>{overview.totalVerified.toLocaleString()}</strong>
            </div>
            <div className="dashboard-hero-metric">
              <span>{groupSummaryLabel}</span>
              <strong>{overview.groupsFormed.toLocaleString()}</strong>
            </div>
            <div className="dashboard-hero-metric">
              <span>Group Savings</span>
              <strong>{formatCurrency(overview.aggregatedGroupSavings)}</strong>
            </div>
            <div className="dashboard-hero-metric">
              <span>Member Savings</span>
              <strong>{formatCurrency(overview.aggregatedMemberSavings)}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-head">
          <h2>Summary Cards</h2>
          <p>Counts are calculated from the groups visible to your account.</p>
        </div>

        <div className="web-dashboard-grid">
          <DashboardStatCard
            title="Members Allocated to Groups"
            helper="Selected beneficiaries"
            icon={checkmarkCircleOutline}
            loading={loading}
            value={overview.totalVerified}
            accentClass="accent-verified"
            onClick={() => history.push("/dashboard/summary/verified")}
          />

          <DashboardStatCard
            title={groupSummaryLabel}
            helper={roleId === 5 ? "Groups in your assigned TAs" : "All groups in scope"}
            icon={peopleOutline}
            loading={loading}
            value={overview.groupsFormed}
            accentClass="accent-groups"
            onClick={() => history.push("/dashboard/summary/groups")}
          />

          <DashboardStatCard
            title="Group Trainings"
            helper="Recorded training sessions"
            icon={schoolOutline}
            loading={loading}
            value={overview.trainings}
            accentClass="accent-trainings"
            onClick={() => history.push("/dashboard/summary/trainings")}
          />

          <DashboardStatCard
            title="Meetings"
            helper="Recorded group meetings"
            icon={listOutline}
            loading={loading}
            value={overview.meetings}
            accentClass="accent-meetings"
            onClick={() => history.push("/dashboard/summary/meetings")}
          />

          <DashboardStatCard
            title="Aggregated Group Savings"
            helper="All visible group savings"
            icon={cashOutline}
            loading={loading}
            value={formatCurrency(overview.aggregatedGroupSavings)}
            accentClass="accent-savings"
            onClick={() => history.push("/dashboard/summary/savingsGroup")}
          />

          <DashboardStatCard
            title="Aggregated Member Savings"
            helper="All visible member savings"
            icon={cashOutline}
            loading={loading}
            value={formatCurrency(overview.aggregatedMemberSavings)}
            accentClass="accent-savings"
            onClick={() => history.push("/dashboard/summary/savingsMember")}
          />

          <DashboardStatCard
            title="Group IGAs"
            helper="Group IGA records"
            icon={barChartOutline}
            loading={loading}
            value={overview.groupIGAs}
            accentClass="accent-group-iga"
            onClick={() => history.push("/dashboard/summary/groupIGAs")}
          />

          <DashboardStatCard
            title="Member IGAs"
            helper="Beneficiary IGA records"
            icon={storefrontOutline}
            loading={loading}
            value={overview.memberIGAs}
            accentClass="accent-member-iga"
            onClick={() => history.push("/dashboard/summary/memberIGAs")}
          />

          <DashboardStatCard
            title="My Verified Members"
            helper="Verified on this device"
            icon={pieChartOutline}
            loading={loading}
            value={overview.myVerified}
            accentClass="accent-device"
            onClick={() => history.push("/dashboard/summary/myVerified")}
          />
        </div>
      </section>

      <section className="web-home__grid">
        {quickLinks.map((item) => (
          <article key={item.to} className="card web-home__card">
            <h2>{item.title}</h2>
            <p className="muted">{item.description}</p>
            <Link to={item.to} className="btn web-home__cta">
              {item.cta}
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
};

export default Home;
