import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { WorksiteForm } from '@/components/worksites/WorksiteForm';
import { ApiError } from '@/lib/errors';
import { WORKSITE_STATUS_LABELS } from '@/lib/labels';
import { parseId } from '@/lib/params';
import { orLogin } from '@/lib/session-guard';
import { worksiteValuesFromWorksite } from '@/lib/worksite-form';
import { canEditWorksite } from '@/lib/worksite-status-ui';
import { getWorksite } from '@/lib/worksites';
import { updateWorksiteAction } from '../../actions';

type Params = Promise<{ id: string }>;

export default function EditWorksitePage({ params }: { params: Params }) {
  return (
    <Suspense
      fallback={
        <p className="text-neutral-600 dark:text-neutral-400">
          Chargement du chantier…
        </p>
      }
    >
      <EditWorksiteContent params={params} />
    </Suspense>
  );
}

async function EditWorksiteContent({ params }: { params: Params }) {
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

  if (!canEditWorksite(worksite.status)) {
    return (
      <>
        <h1 className="text-2xl font-semibold">{worksite.reference}</h1>
        <p className="mt-2">
          Ce chantier est «{' '}
          {WORKSITE_STATUS_LABELS[worksite.status].toLowerCase()} » : il ne peut
          plus être modifié.
        </p>
        <p className="mt-4">
          <Link href={`/chantiers/${worksite.id}`} className="underline">
            Retour au chantier
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">
        Modifier <span className="font-mono">{worksite.reference}</span>
      </h1>
      <div className="mt-6">
        <WorksiteForm
          action={updateWorksiteAction.bind(null, worksite.id)}
          initialValues={worksiteValuesFromWorksite(worksite)}
          cancelHref={`/chantiers/${worksite.id}`}
        />
      </div>
    </>
  );
}
