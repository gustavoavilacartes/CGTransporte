import { useState } from 'react';
import InfraccionesVelocidadView from './modules/InfraccionesVelocidad/View';

const MODULOS = [
  { id: 'resumen', label: 'Resumen general', disponible: false },
  { id: 'infracciones-velocidad', label: 'Infracciones de velocidad', disponible: true },
  { id: 'geocercas', label: 'Geocercas y rutas prohibidas', disponible: false },
  { id: 'jornada', label: 'Jornada laboral', disponible: false },
  { id: 'somnolencia', label: 'Adherencia — somnolencia', disponible: false },
  { id: 'rendimiento', label: 'Rendimiento de flota', disponible: false },
  { id: 'productividad', label: 'Productividad', disponible: false },
];

function ModuloPendiente({ nombre }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', padding: 40, textAlign: 'center', color: 'var(--ink-soft)' }}>
      <p style={{ margin: 0 }}>El módulo "{nombre}" aún no está construido.</p>
    </div>
  );
}

export default function App() {
  const [moduloActivo, setModuloActivo] = useState('infracciones-velocidad');
  const [navAbierto, setNavAbierto] = useState(false);

  const modulo = MODULOS.find((m) => m.id === moduloActivo);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {navAbierto && (
        <div
          onClick={() => setNavAbierto(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(28,35,33,0.4)', zIndex: 20 }}
        />
      )}

      <aside
        style={{
          width: 248,
          flexShrink: 0,
          background: 'var(--primary)',
          color: '#E9EDE9',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 0',
          position: 'fixed',
          top: 0, bottom: 0, left: 0,
          zIndex: 30,
          transform: navAbierto ? 'translateX(0)' : undefined,
          transition: 'transform 0.2s ease',
        }}
        className="sidebar"
      >
        <div style={{ padding: '0 24px 20px 24px', borderBottom: '1px solid var(--primary-line)', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Desempeño de Flota</div>
          <div style={{ fontSize: 12, color: '#B8C4BC', marginTop: 2 }}>ARAUCO · Transporte</div>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 12px' }}>
          {MODULOS.map((m) => (
            <div
              key={m.id}
              onClick={() => { setModuloActivo(m.id); setNavAbierto(false); }}
              style={{
                padding: '10px 12px',
                borderRadius: 4,
                fontSize: 14,
                color: m.id === moduloActivo ? '#fff' : '#C9D3CC',
                background: m.id === moduloActivo ? 'var(--primary-soft)' : 'transparent',
                borderLeft: m.id === moduloActivo ? '2px solid #E9C063' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              {m.label}
            </div>
          ))}
        </nav>
      </aside>

      <main style={{ flex: 1, minWidth: 0, marginLeft: 248 }} className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 32px', borderBottom: '1px solid var(--line)', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => setNavAbierto(true)}
              className="menu-toggle"
              style={{ display: 'none', background: 'none', border: 'none', marginRight: 12 }}
              aria-label="Abrir menú"
            >
              ☰
            </button>
            <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{modulo?.label}</h1>
          </div>
        </div>

        <div style={{ padding: '28px 32px 60px 32px' }}>
          {moduloActivo === 'infracciones-velocidad' && <InfraccionesVelocidadView />}
          {moduloActivo !== 'infracciones-velocidad' && <ModuloPendiente nombre={modulo?.label} />}
        </div>
      </main>

      <style>{`
        @media (max-width: 720px) {
          .sidebar { transform: translateX(-100%); }
          .main-content { margin-left: 0 !important; }
          .menu-toggle { display: block !important; }
        }
      `}</style>
    </div>
  );
}
