import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { WorksiteDetailView } from '@/components/worksites/WorksiteDetailView';
import { WorksiteStatusPanel } from '@/components/worksites/WorksiteStatusPanel';
import { ApiError } from '@/lib/errors';
import { parseId } from '@/lib/params';
import { orLogin } from '@/lib/session-guard';
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
