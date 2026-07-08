import { useEffect, useMemo, useState } from "react";
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
import { format } from "date-fns";
import toast from "react-hot-toast";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import ErrorMessage from "@/components/common/ErrorMessage";
import Loader from "@/components/common/Loader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { getAnalyticsInterviews, getAnalyticsOverview, getAnalyticsSkills } from "@/services/analyticsService";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#0f766e", "#2563eb", "#8b5cf6"];

function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [skills, setSkills] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadAnalytics() {
      try {
        setLoading(true);
        const settledResults = await Promise.allSettled([
          getAnalyticsOverview(),
          getAnalyticsInterviews(),
          getAnalyticsSkills(),
        ]);
        const [overviewData, interviewData, skillsData] = settledResults;

        if (!mounted) return;

        const nextOverview = overviewData.status === "fulfilled" ? overviewData.value : null;
        const nextInterviews = interviewData.status === "fulfilled" ? interviewData.value : [];
        const nextSkills = skillsData.status === "fulfilled" ? skillsData.value : null;

        setOverview(nextOverview);
        setInterviews(nextInterviews);
        setSkills(nextSkills);

        if (settledResults.some((result) => result.status === "rejected")) {
          toast.error("Some analytics data could not be loaded.");
        }

        if (settledResults.every((result) => result.status === "rejected")) {
          setError("We couldn't load analytics right now.");
        }
      } catch (err) {
        if (mounted) {
          setError(err?.response?.data?.detail || "We couldn't load analytics right now.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      mounted = false;
    };
  }, []);

  const scoreTrend = useMemo(
    () =>
      (overview?.score_progression ?? []).map((item, index) => ({
        name: format(new Date(item.generated_at), "MMM d"),
        score: item.score,
        index,
      })),
    [overview],
  );

  const scoredInterviews = useMemo(() => interviews.filter((item) => item.overall_score != null), [interviews]);
  const hasScoreData = scoreTrend.length > 0 || scoredInterviews.length > 0;
  const recentHistory = overview?.recent_interview_history ?? [];

  const weeklyActivity = useMemo(() => {
    const buckets = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => ({ day, interviews: 0 }));
    interviews.forEach((item) => {
      const date = new Date(item.created_at);
      if (!Number.isNaN(date.getTime())) {
        buckets[date.getDay()].interviews += 1;
      }
    });
    return buckets;
  }, [interviews]);

  const performanceDistribution = useMemo(() => {
    const ranges = [
      { label: "0-49", value: 0 },
      { label: "50-64", value: 0 },
      { label: "65-79", value: 0 },
      { label: "80-89", value: 0 },
      { label: "90-100", value: 0 },
    ];

    scoredInterviews.forEach((item) => {
      const score = item.overall_score ?? 0;
      if (score < 50) ranges[0].value += 1;
      else if (score < 65) ranges[1].value += 1;
      else if (score < 80) ranges[2].value += 1;
      else if (score < 90) ranges[3].value += 1;
      else ranges[4].value += 1;
    });

    return ranges;
  }, [scoredInterviews]);

  const skillSnapshot = useMemo(() => {
    const strongest = skills?.strongest_skills ?? [];
    const weakest = skills?.weakest_skills ?? [];
    return [
      ...strongest.slice(0, 3).map((item, index) => ({ name: item, value: 100 - index * 6, type: "strongest" })),
      ...weakest.slice(0, 3).map((item, index) => ({ name: item, value: Math.max(10, 50 - index * 6), type: "weakest" })),
    ];
  }, [skills]);

  if (loading) {
    return <Loader label="Loading analytics..." />;
  }

  if (error) {
    return <ErrorMessage title="Analytics unavailable" description={error} />;
  }

  if (!interviews.length && !overview?.score_progression?.length) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Analytics"
          title="Measure growth across every prep cycle"
          description="Use scoring trends to identify consistency, calibration, and opportunities for sharper outcomes."
          badge="No data yet"
        />
        <EmptyState
          title="No analytics available yet"
          description="Complete a few interview sessions to unlock live charts and skill insights."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Analytics"
        title="Measure growth across every prep cycle"
        description="Use scoring trends to identify consistency, calibration, and opportunities for sharper outcomes."
        badge="Backend synced"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Interview History</p>
            <h3 className="mt-3 text-3xl font-semibold">{overview?.interview_history_count ?? interviews.length}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Average Score</p>
            <h3 className="mt-3 text-3xl font-semibold">{hasScoreData ? `${Math.round(overview?.average_score ?? 0)}%` : "—"}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Best Score</p>
            <h3 className="mt-3 text-3xl font-semibold">{hasScoreData ? `${overview?.best_score ?? 0}%` : "—"}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Recent Interviews</p>
            <h3 className="mt-3 text-3xl font-semibold">{recentHistory.length}</h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Score Trend</CardTitle>
              <CardDescription>Score progression returned by the analytics service.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-80">
            {scoreTrend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreTrend} margin={{ left: -20, right: 8 }}>
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#trendGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No trend data" description="The backend has not produced a score progression yet." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Skill Growth</CardTitle>
              <CardDescription>Derived from the backend skill rankings.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-80">
            {skillSnapshot.length && hasScoreData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillSnapshot}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                    {skillSnapshot.map((entry, index) => (
                      <Cell key={entry.name} fill={entry.type === "strongest" ? COLORS[index % COLORS.length] : "hsl(var(--muted-foreground))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No skill data yet" description="Complete reports to surface skill rankings." />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Weekly Activity</CardTitle>
              <CardDescription>Interview count by day of week.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="interviews" fill="hsl(var(--primary))" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Performance Distribution</CardTitle>
              <CardDescription>Score bands across completed interviews.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-80">
            {performanceDistribution.some((entry) => entry.value > 0) ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={performanceDistribution} dataKey="value" nameKey="label" innerRadius={72} outerRadius={110} paddingAngle={5}>
                      {performanceDistribution.map((entry, index) => (
                        <Cell key={entry.label} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 flex flex-wrap gap-2">
                  {performanceDistribution.map((entry, index) => (
                    <Badge key={entry.label} variant="info">
                      {entry.label}: {entry.value}
                    </Badge>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState title="No performance data yet" description="Complete scored interviews to see score bands here." />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Domain Strengths</CardTitle>
              <CardDescription>Strongest domains surfaced by completed reports.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {overview?.strongest_domains?.length ? (
              overview.strongest_domains.map((domain) => (
                <Badge key={domain} variant="info">
                  {domain}
                </Badge>
              ))
            ) : (
              <EmptyState title="No domain strengths yet" description="Complete more interviews to reveal domain trends." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Domain Gaps</CardTitle>
              <CardDescription>Weakest domains surfaced by completed reports.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {overview?.weakest_domains?.length ? (
              overview.weakest_domains.map((domain) => (
                <Badge key={domain} variant="default">
                  {domain}
                </Badge>
              ))
            ) : (
              <EmptyState title="No domain gaps yet" description="Complete more interviews to reveal domain trends." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Recent Interview History</CardTitle>
            <CardDescription>Latest completed sessions returned by the analytics service.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentHistory.length ? (
            recentHistory.map((item) => (
              <div key={String(item.id)} className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-muted/50 p-4">
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.domain} • {item.difficulty} • {item.type}
                  </p>
                </div>
                <Badge variant="info">{item.overall_score != null ? `${item.overall_score}%` : "—"}</Badge>
              </div>
            ))
          ) : (
            <EmptyState title="No recent history" description="Complete an interview to populate the recent history feed." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AnalyticsPage;
