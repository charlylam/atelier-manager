import { Suspense } from 'react';
import { LateWorksites } from '@/components/dashboard/LateWorksites';
import { QuoteSummary } from '@/components/dashboard/QuoteSummary';
import { RevenueCard } from '@/components/dashboard/RevenueCard';
import { WorksiteStatusCards } from '@/components/dashboard/WorksiteStatusCards';
import { getDashboard } from '@/lib/dashboard';
import { parseMonth } from '@/lib/months';
import { orLogin } from '@/lib/session-guard';

type SearchParams = Promise<{ month?: string }>;

export default function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <>
      <h1 className="text-2xl font-semibold">Tableau de bord</h1>
      <Suspense
        fallback={
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">
            Chargement des indicateurs…
          </p>
        }
      >
        <DashboardContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function DashboardContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { month } = await searchParams;
  const dashboard = await orLogin(getDashboard(parseMonth(month)));

  return (
    <div className="mt-6 flex flex-col gap-8">
      <WorksiteStatusCards counts={dashboard.worksites.byStatus} />
      <LateWorksites late={dashboard.worksites.late} />
      <QuoteSummary quotes={dashboard.quotes} />
      <RevenueCard revenue={dashboard.revenue} />
    </div>
  );
}
