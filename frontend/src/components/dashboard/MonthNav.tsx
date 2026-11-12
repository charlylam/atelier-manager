import Link from 'next/link';
import { formatMonth, shiftMonth } from '@/lib/months';

const BASE_PATH = '/tableau-de-bord';

export function MonthNav({ month }: { month: string }) {
  return (
    <nav aria-label="Choix du mois" className="flex items-center gap-3 text-sm">
      <Link
        href={`${BASE_PATH}?month=${shiftMonth(month, -1)}`}
        rel="prev"
        className="underline"
      >
        Mois précédent
      </Link>
      <span className="font-medium capitalize">{formatMonth(month)}</span>
      <Link
        href={`${BASE_PATH}?month=${shiftMonth(month, 1)}`}
        rel="next"
        className="underline"
      >
        Mois suivant
      </Link>
      <Link
        href={BASE_PATH}
        className="ml-2 text-neutral-600 dark:text-neutral-400 underline"
      >
        Mois en cours
      </Link>
    </nav>
  );
}
