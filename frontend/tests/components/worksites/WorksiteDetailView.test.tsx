// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { PhasesTable } from '@/components/worksites/PhasesTable';
import { WorksiteDetailView } from '@/components/worksites/WorksiteDetailView';
import type { Phase, Worksite } from '@/lib/worksites';

const PHASE: Phase = {
  id: 10,
  position: 1,
  name: 'Débit',
  status: 'done',
  estimatedHours: '8.00',
  actualHours: '7.50',
  notes: null,
  assignee: null,
};

const WORKSITE: Worksite = {
  id: 4,
  reference: 'CH-2026-0001',
  title: 'Bibliothèque sur mesure en chêne',
  description: 'Chêne massif, finition huilée.',
  siteAddress: null,
  status: 'in_production',
  dueDate: '2026-12-15',
  createdAt: '2026-11-10T10:00:00.000Z',
  updatedAt: '2026-11-10T10:00:00.000Z',
  client: {
    id: 3,
    code: 'CLI-0001',
    name: 'Famille Durand',
    address: '12 rue des Lilas, Lyon',
  },
  quote: { id: 7, reference: 'DEV-2026-0001' },
  phases: [
    PHASE,
    {
      ...PHASE,
      id: 11,
      position: 2,
      name: 'Usinage',
      status: 'in_progress',
      estimatedHours: '12.50',
      actualHours: '0.00',
      notes: 'Prévoir le gabarit',
    },
  ],
  totals: { estimatedHours: '20.50', actualHours: '7.50' },
};

describe('WorksiteDetailView', () => {
  it('affiche la référence, le titre, le statut, le client et le lien vers le devis', () => {
    render(<WorksiteDetailView worksite={WORKSITE} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'CH-2026-0001 · Bibliothèque sur mesure en chêne'
    );
    expect(screen.getByText('En fabrication')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Famille Durand' })
    ).toHaveAttribute('href', '/clients/3');
    expect(screen.getByRole('link', { name: 'DEV-2026-0001' })).toHaveAttribute(
      'href',
      '/devis/7'
    );
    expect(screen.getByRole('link', { name: '← Chantiers' })).toHaveAttribute(
      'href',
      '/chantiers'
    );
    expect(screen.getByText('15/12/2026')).toBeInTheDocument();
    expect(
      screen.getByText('Chêne massif, finition huilée.')
    ).toBeInTheDocument();
  });

  it('sans adresse de chantier, indique l’adresse du client', () => {
    render(<WorksiteDetailView worksite={WORKSITE} />);

    expect(
      screen.getByText('12 rue des Lilas, Lyon (adresse du client)')
    ).toBeInTheDocument();
  });

  it('affiche l’adresse du chantier quand elle existe', () => {
    render(
      <WorksiteDetailView
        worksite={{ ...WORKSITE, siteAddress: '5 place du Marché, Annecy' }}
      />
    );

    expect(screen.getByText('5 place du Marché, Annecy')).toBeInTheDocument();
    expect(screen.queryByText(/adresse du client/)).not.toBeInTheDocument();
  });

  it('affiche un tiret pour l’échéance, la description et l’adresse absentes', () => {
    render(
      <WorksiteDetailView
        worksite={{
          ...WORKSITE,
          phases: [], // sans phase : aucune cellule de notes, qui porte aussi un tiret
          dueDate: null,
          description: null,
          client: { ...WORKSITE.client, address: null },
        }}
      />
    );

    expect(screen.getAllByText('—')).toHaveLength(3);
  });
});

describe('WorksiteDetailView : emplacement du statut', () => {
  it('affiche le panneau de statut après la section des phases', () => {
    render(
      <WorksiteDetailView
        worksite={WORKSITE}
        statusPanel={<p>Panneau de statut</p>}
      />
    );

    const panel = screen.getByText('Panneau de statut');
    const phases = screen.getByRole('region', { name: 'Phases' });

    expect(phases).not.toContainElement(panel);
    expect(
      phases.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('n’affiche rien de plus sans panneau de statut', () => {
    const { container } = render(<WorksiteDetailView worksite={WORKSITE} />);

    expect(container.lastElementChild).toBe(
      screen.getByRole('region', { name: 'Phases' })
    );
  });
});

describe('PhasesTable', () => {
  it('liste les phases dans l’ordre, avec statut, heures et notes', () => {
    render(<PhasesTable phases={WORKSITE.phases} totals={WORKSITE.totals} />);

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(rows[1]).toHaveTextContent('1.Débit');
    expect(rows[1]).toHaveTextContent('Terminée');
    expect(rows[1]).toHaveTextContent('8 h');
    expect(rows[1]).toHaveTextContent('7,5 h');
    expect(within(rows[1]).getAllByRole('cell')[4]).toHaveTextContent('—');
    expect(rows[2]).toHaveTextContent('2.Usinage');
    expect(rows[2]).toHaveTextContent('En cours');
    expect(rows[2]).toHaveTextContent('12,5 h');
    expect(rows[2]).toHaveTextContent('0 h');
    expect(rows[2]).toHaveTextContent('Prévoir le gabarit');
  });

  it('affiche les totaux d’heures', () => {
    render(<PhasesTable phases={WORKSITE.phases} totals={WORKSITE.totals} />);

    expect(screen.getByText('Total estimé').nextSibling).toHaveTextContent(
      '20,5 h'
    );
    expect(screen.getByText('Total réel').nextSibling).toHaveTextContent(
      '7,5 h'
    );
  });

  it('indique qu’il n’y a aucune phase', () => {
    render(
      <PhasesTable
        phases={[]}
        totals={{ estimatedHours: '0.00', actualHours: '0.00' }}
      />
    );

    expect(screen.getByText('Aucune phase.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
