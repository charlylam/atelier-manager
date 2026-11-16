import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { WorksiteDetailView } from '@/components/worksites/WorksiteDetailView';
import { WorksiteStatusPanel } from '@/components/worksites/WorksiteStatusPanel';
import { ApiError } from '@/lib/errors';
import { parseId } from '@/lib/params';
import { orLogin } from '@/lib/session-guard';
import { canEditWorksite } from '@/lib/worksite-status-ui';
import { getWorksite } from '@/lib/worksites';
import { changeWorksiteStatusAction } from '../status-actions';

type Params = Promise<{ id: string }>;

export default function WorksitePage({ params }: { params: Params }) {
  return (
    <Suspense
      fallback={
        <p className="text-neutral-600 dark:text-neutral-400">
          Chargement du chantier…
        </p>
      }
    >
      <WorksiteContent params={params} />
    </Suspense>
  );
}

async function WorksiteContent({ params }: { params: Params }) {
  const id = parseId((await params).id);
  if (id === undefined) {
    notFound();
  }

  let worksite;
  try {
    worksite = await orLogin(getWorksite(id));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <WorksiteDetailView
      worksite={worksite}
      actions={
        canEditWorksite(worksite.status) && (
          <Link
            href={`/chantiers/${worksite.id}/modifier`}
            className="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1 text-sm"
          >
            Modifier
          </Link>
        )
      }
      statusPanel={
        <WorksiteStatusPanel
          worksite={worksite}
          statusAction={(target) =>
            changeWorksiteStatusAction.bind(null, worksite.id, target)
          }
        />
      }
    />
  );
}
