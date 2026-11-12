'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/tableau-de-bord', label: 'Tableau de bord' },
  { href: '/clients', label: 'Clients' },
  { href: '/devis', label: 'Devis' },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="flex items-center gap-4 text-sm"
    >
      {LINKS.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={
              active
                ? 'font-semibold underline'
                : 'text-neutral-600 dark:text-neutral-400 hover:underline'
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
