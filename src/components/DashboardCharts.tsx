"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#1f8a6e", "#2aa882", "#0f766e", "#5bb89a", "#134e4a", "#99c9b8"];

type MonthPoint = { label: string; total: number };
type PersonPoint = { name: string; total: number; count: number };

function MoneyTip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <strong>{label || payload[0]?.name}</strong>
      <p>Rs {Number(payload[0].value).toLocaleString("en-PK")}</p>
    </div>
  );
}

export function DashboardCharts({
  monthly,
  byPerson,
}: {
  monthly: MonthPoint[];
  byPerson: PersonPoint[];
}) {
  const pieData = byPerson.map((p) => ({
    name: p.name,
    value: p.total,
  }));

  const hasMonthData = monthly.some((m) => m.total > 0);
  const hasPersonData = pieData.length > 0;

  return (
    <div className="charts-grid">
      <section className="panel chart-panel">
        <div className="panel-head-row">
          <h2>Spend trend</h2>
          <span className="chip">Last 6 months</span>
        </div>
        {hasMonthData ? (
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1f8a6e" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#1f8a6e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(12,18,16,0.08)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#6b7a73", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#6b7a73", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip content={<MoneyTip />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#1f8a6e"
                  strokeWidth={2.5}
                  fill="url(#spendFill)"
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="chart-empty">
            <div className="pulse-ring" />
            <p>Add expenses to see your monthly spend curve animate in.</p>
          </div>
        )}
      </section>

      <section className="panel chart-panel">
        <div className="panel-head-row">
          <h2>By person</h2>
          <span className="chip">Share of spend</span>
        </div>
        {hasPersonData ? (
          <div className="chart-box pie-wrap">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={3}
                  animationDuration={1100}
                  animationEasing="ease-out"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<MoneyTip />} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="legend">
              {byPerson.map((p, i) => (
                <li key={p.name}>
                  <i style={{ background: COLORS[i % COLORS.length] }} />
                  <span>{p.name}</span>
                  <strong>Rs {p.total.toLocaleString("en-PK")}</strong>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="chart-empty">
            <div className="pulse-ring" />
            <p>When people spend, their share shows here as a donut chart.</p>
          </div>
        )}
      </section>

      <section className="panel chart-panel chart-wide">
        <div className="panel-head-row">
          <h2>Person comparison</h2>
          <span className="chip">Bar view</span>
        </div>
        {hasPersonData ? (
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byPerson}>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(12,18,16,0.08)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#6b7a73", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#6b7a73", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip content={<MoneyTip />} />
                <Bar
                  dataKey="total"
                  radius={[8, 8, 4, 4]}
                  fill="#1f8a6e"
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="chart-empty short">
            <p>Bars will compare each person’s total spend.</p>
          </div>
        )}
      </section>
    </div>
  );
}
