"use client";

import { useMemo } from "react";
import { FlaskConical } from "lucide-react";
import { EmptyState, KpiCard, PageHeader } from "@/components/admin/bits";
import {
  CHANNEL_COLORS,
  ChannelDonut,
  MixDonut,
  RankedBars,
  SERVICE_COLORS,
  SessionsChart,
} from "@/components/admin/charts";
import { DateRangePicker, useDateRange } from "@/components/admin/date-range-picker";
import { ExportMenu } from "@/components/admin/export-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  campaignRows,
  channelTotals,
  countryRows,
  landingPageRows,
  leadsInRange,
  serviceMix,
  sessionsTrend,
  topLeadRoutes,
  trafficTotals,
  type NamedStatsRow,
} from "@/lib/admin/metrics";
import { getCity } from "@/lib/geo";
import { useAdminData } from "@/lib/admin/store";
import { useI18n } from "@/i18n/provider";

function StatsTable({ rows, nameHeader }: { rows: NamedStatsRow[]; nameHeader: string }) {
  const { dict, t } = useI18n();
  const ax = dict.admin.analytics;
  if (rows.length === 0) {
    return <EmptyState title={ax.noTrafficInRange} className="m-4" />;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{nameHeader}</TableHead>
          <TableHead className="text-end">{ax.colSessions}</TableHead>
          <TableHead className="text-end">{ax.colLeads}</TableHead>
          <TableHead className="text-end">{ax.colConversion}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="text-[13px] font-medium">{row.label}</TableCell>
            <TableCell className="tnum text-end text-[13px]">
              {t.number(row.sessions)}
            </TableCell>
            <TableCell className="tnum text-end text-[13px]">{row.leads}</TableCell>
            <TableCell className="tnum text-end text-[13px]">
              {t.percent(row.conversionRate, 1)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function AnalyticsView() {
  const { dict, t } = useI18n();
  const ax = dict.admin.analytics;
  const data = useAdminData();
  const dateRange = useDateRange(data.anchorMs, "30d");
  const { range } = dateRange;

  const totals = useMemo(() => trafficTotals(data.traffic, range), [data.traffic, range]);
  const trend = useMemo(() => sessionsTrend(data.traffic, range), [data.traffic, range]);
  const channels = useMemo(() => channelTotals(data.traffic, range), [data.traffic, range]);
  const campaigns = useMemo(() => campaignRows(data, range), [data, range]);
  const pages = useMemo(() => landingPageRows(data.traffic, range), [data.traffic, range]);
  const countries = useMemo(
    () => countryRows(data.traffic, range).slice(0, 10),
    [data.traffic, range],
  );

  const rangeLeads = useMemo(() => leadsInRange(data.leads, range), [data.leads, range]);

  const routes = useMemo(
    () =>
      topLeadRoutes(rangeLeads, 8).map((r) => ({
        key: `${r.fromCode}:${r.toCode}`,
        label: `${getCity(r.fromCode)?.name ?? r.fromCode} → ${getCity(r.toCode)?.name ?? r.toCode}`,
        value: r.count,
      })),
    [rangeLeads],
  );

  const services = useMemo(
    () =>
      serviceMix(rangeLeads).map((s) => ({
        id: s.service,
        label: dict.enums.serviceLevel[s.service].label,
        value: s.count,
        color: SERVICE_COLORS[s.service],
      })),
    [rangeLeads, dict],
  );

  const donutData = useMemo(
    () =>
      channels
        .filter((c) => c.leads > 0)
        .map((c) => ({
          channel: c.channel,
          label: dict.admin.labels.channel[c.channel],
          value: c.leads,
        })),
    [channels, dict],
  );

  const buildChannelSheet = () => ({
    headers: [ax.colChannel, ax.colSessions, ax.colVisitors, ax.colLeads, ax.colConversionRate],
    rows: channels.map((c) => [
      dict.admin.labels.channel[c.channel],
      c.sessions,
      c.visitors,
      c.leads,
      Math.round(c.conversionRate * 1000) / 10 + "%",
    ]),
  });

  return (
    <div className="animate-rise">
      <PageHeader
        title={ax.title}
        description={ax.description}
        actions={
          <>
            <DateRangePicker
              value={dateRange}
              onPreset={dateRange.setPreset}
              onCustom={dateRange.setCustom}
            />
            <ExportMenu
              basename={`rotamove-traffic-${range.end}`}
              buildSheet={buildChannelSheet}
            />
          </>
        }
      />

      <Alert className="mb-4">
        <FlaskConical aria-hidden />
        <AlertTitle>{ax.simulatedTitle}</AlertTitle>
        <AlertDescription>{ax.simulatedBody}</AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label={ax.kpiSessions} value={t.compact(totals.sessions)} />
        <KpiCard label={ax.kpiVisitors} value={t.compact(totals.visitors)} />
        <KpiCard
          label={ax.kpiLeads}
          value={t.number(totals.leads)}
          hint={ax.kpiLeadsHint}
        />
        <KpiCard
          label={ax.kpiSessionToLead}
          value={t.percent(totals.conversionRate, 2)}
          hint={ax.kpiSessionToLeadHint}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="shadow-soft xl:col-span-2">
          <CardHeader>
            <CardTitle>{ax.sessionsByChannelTitle}</CardTitle>
            <CardDescription>{ax.sessionsByChannelDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <SessionsChart data={trend} className="h-72 w-full" />
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>{ax.leadShareTitle}</CardTitle>
            <CardDescription>{ax.leadShareDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {donutData.length === 0 ? (
              <EmptyState title={ax.noLeadsInRange} className="py-8" />
            ) : (
              <ChannelDonut data={donutData} className="h-64 w-full" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lead demand: where enquiries flow and what they ask for. */}
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="shadow-soft xl:col-span-2">
          <CardHeader>
            <CardTitle>{dict.admin.routesCard.title}</CardTitle>
            <CardDescription>{dict.admin.routesCard.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {routes.length === 0 ? (
              <EmptyState title={dict.admin.routesCard.empty} className="py-8" />
            ) : (
              <RankedBars items={routes} className="columns-1 md:columns-2 md:gap-8" />
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>{dict.admin.routesCard.serviceTitle}</CardTitle>
            <CardDescription>{dict.admin.routesCard.serviceDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {services.length === 0 ? (
              <EmptyState title={dict.admin.routesCard.empty} className="py-8" />
            ) : (
              <MixDonut data={services} className="h-64 w-full" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 gap-0 overflow-hidden py-0 shadow-soft">
        <CardHeader className="pt-6 pb-4">
          <CardTitle>{ax.channelsTitle}</CardTitle>
          <CardDescription>{ax.channelsDescription}</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{ax.colChannel}</TableHead>
                <TableHead className="text-end">{ax.colSessions}</TableHead>
                <TableHead className="text-end">{ax.colVisitors}</TableHead>
                <TableHead className="text-end">{ax.colLeads}</TableHead>
                <TableHead className="text-end">{ax.colConversion}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.map((c) => (
                <TableRow key={c.channel}>
                  <TableCell>
                    <span className="flex items-center gap-2 text-[13px] font-medium">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ background: CHANNEL_COLORS[c.channel] }}
                        aria-hidden
                      />
                      {dict.admin.labels.channel[c.channel]}
                    </span>
                  </TableCell>
                  <TableCell className="tnum text-end text-[13px]">
                    {t.number(c.sessions)}
                  </TableCell>
                  <TableCell className="tnum text-end text-[13px]">
                    {t.number(c.visitors)}
                  </TableCell>
                  <TableCell className="tnum text-end text-[13px]">{c.leads}</TableCell>
                  <TableCell className="tnum text-end text-[13px]">
                    {t.percent(c.conversionRate, 1)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="gap-0 overflow-hidden py-0 shadow-soft">
          <CardHeader className="pt-6 pb-4">
            <CardTitle>{ax.campaignsTitle}</CardTitle>
            <CardDescription>{ax.campaignsDescription}</CardDescription>
          </CardHeader>
          <StatsTable rows={campaigns} nameHeader={ax.colCampaign} />
        </Card>

        <Card className="gap-0 overflow-hidden py-0 shadow-soft">
          <CardHeader className="pt-6 pb-4">
            <CardTitle>{ax.landingPagesTitle}</CardTitle>
            <CardDescription>{ax.landingPagesDescription}</CardDescription>
          </CardHeader>
          <StatsTable rows={pages} nameHeader={ax.colPage} />
        </Card>

        <Card className="gap-0 overflow-hidden py-0 shadow-soft">
          <CardHeader className="pt-6 pb-4">
            <CardTitle>{ax.countriesTitle}</CardTitle>
            <CardDescription>{ax.countriesDescription}</CardDescription>
          </CardHeader>
          <StatsTable rows={countries} nameHeader={ax.colCountry} />
        </Card>
      </div>
    </div>
  );
}
