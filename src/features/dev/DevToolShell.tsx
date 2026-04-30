import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { ClassesEditor } from './ClassesEditor';
import { ItemsEditor } from './ItemsEditor';
import { SkillsEditor } from './SkillsEditor';
import { MonstersEditor } from './MonstersEditor';
import { MapManager } from './MapManager';

const links = [
  { to: '/dev/classes', label: 'Classes', description: 'Class stats and starter skills' },
  { to: '/dev/items', label: 'Items', description: 'Bases, uniques, and sets' },
  { to: '/dev/skills', label: 'Skills', description: 'Damage, cooldown, and scaling' },
  { to: '/dev/monsters', label: 'Monsters', description: 'Archetype combat tuning' },
  { to: '/dev/maps', label: 'Maps', description: 'Sub-area levels and waves' }
] as const;

export default function DevToolShell() {
  return (
    <div className="min-h-[100dvh] bg-d2-bg text-d2-white md:flex">
      <aside className="border-b border-d2-border bg-d2-panel p-3 md:w-64 md:border-b-0 md:border-r">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-d2-white/50">Localhost only</p>
            <h1 className="font-serif text-2xl text-d2-gold">Dev Tool</h1>
          </div>
          <NavLink
            to="/"
            className="shrink-0 rounded border border-d2-border px-2 py-1 text-xs text-d2-white/80 hover:border-d2-gold hover:text-d2-gold"
            data-testid="dev-back-to-game"
            title="Back to game"
          >
            ← Game
          </NavLink>
        </div>
        <nav aria-label="Dev tool">
          <ul className="grid gap-2">
            <li><DevNavLink to="/dev">Overview</DevNavLink></li>
            {links.map((link) => <li key={link.to}><DevNavLink to={link.to}>{link.label}</DevNavLink></li>)}
          </ul>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 overflow-x-hidden p-3 pb-20 md:p-6">
        <Routes>
          <Route index element={<DevIndex />} />
          <Route path="classes" element={<ClassesEditor />} />
          <Route path="items" element={<ItemsEditor />} />
          <Route path="skills" element={<SkillsEditor />} />
          <Route path="monsters" element={<MonstersEditor />} />
          <Route path="maps" element={<MapManager />} />
          <Route path="*" element={<Navigate to="/dev" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function DevNavLink({ to, children }: { readonly to: string; readonly children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={to === '/dev'}
      className={({ isActive }) => [
        'block min-h-[44px] rounded border px-3 py-2 text-sm',
        isActive ? 'border-d2-gold bg-d2-gold/10 text-d2-gold' : 'border-d2-border text-d2-white/75 hover:text-d2-gold'
      ].join(' ')}
    >
      {children}
    </NavLink>
  );
}

function DevIndex() {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="font-serif text-3xl text-d2-gold">Dev Tool</h1>
        <p className="mt-1 max-w-2xl text-sm text-d2-white/70">
          Edit canonical JSON under src/data while Vite dev server is running. Saves are validated by Ajv before writing to disk.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} className="rounded border border-d2-border bg-d2-panel p-4 hover:border-d2-gold/70">
            <h2 className="font-serif text-xl text-d2-gold">{link.label}</h2>
            <p className="mt-1 text-sm text-d2-white/70">{link.description}</p>
          </NavLink>
        ))}
      </div>
    </section>
  );
}
