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

const COLORS = ["#c47a1a", "#e09a2f", "#1f7a5c", "#2a3140", "#b5473a", "#6a7385"];

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
  const hasPersonData = pieData.some((p) => p.value > 0);

  return (
    <div className="charts-grid">
      <section className="panel chart-panel">
        <div className="panel-head-row">
          <h2>Buys over time</h2>
          <span className="chip">Last 6 months</span>
        </div>
        {hasMonthData ? (
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c47a1a" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#c47a1a" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(18,21,28,0.08)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#6a7385", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#6a7385", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip content={<MoneyTip />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#c47a1a"
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
            <p>Log buys to see the monthly spend curve.</p>
          </div>
        )}
      </section>

      <section className="panel chart-panel">
        <div className="panel-head-row">
          <h2>Who spent</h2>
          <span className="chip">Share of pot</span>
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
            <p>When partners spend from the pot, their share shows here.</p>
          </div>
        )}
      </section>

      <section className="panel chart-panel chart-wide">
        <div className="panel-head-row">
          <h2>Spend comparison</h2>
          <span className="chip">Bar view</span>
        </div>
        {hasPersonData ? (
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byPerson}>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(18,21,28,0.08)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#6a7385", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#6a7385", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip content={<MoneyTip />} />
                <Bar
                  dataKey="total"
                  radius={[8, 8, 4, 4]}
                  fill="#c47a1a"
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="chart-empty short">
            <p>Bars will compare each person’s total buys from the pot.</p>
          </div>
        )}
      </section>
    </div>
  );
}
