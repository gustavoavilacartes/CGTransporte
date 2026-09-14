import { useState, useMemo } from 'react';
import { useInfraccionesVelocidad } from '../../hooks/useInfraccionesVelocidad';
import ImportadorExcel from '../../components/ImportadorExcel';
import { configInfraccionesVelocidad } from '../../config/importConfig.infraccionesVelocidad';
import MapaCalorInfracciones from './MapaCalorInfracciones';

const kpiBoxStyle = { background: '#fff', padding: '18px 20px' };
const kpiLabelStyle = { fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 10 };
const kpiValueStyle = { fontSize: 26, fontWeight: 600 };
const thStyle = { textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--line)', color: 'var(--ink-soft)', fontWeight: 500, fontSize: 12, whiteSpace: 'nowrap' };
const tdStyle = { padding: '10px', borderBottom: '1px solid var(--line)' };

function severidad(exceso) {
  if (exceso > 20) return 'Crítica';
  if (exceso >= 10) return 'Moderada';
  return 'Leve';
}

const severidadColor = {
  'Crítica': { bg: 'var(--alert-bg)', fg: 'var(--alert)' },
  'Moderada': { bg: '#FBF0DD', fg: '#9A6A1E' },
  'Leve': { bg: '#E4EAE5', fg: 'var(--primary)' },
};

function Tag({ texto }) {
  const c = severidadColor[texto] || { bg: '#eee', fg: '#555' };
  return (
    <span style={{ display: 'inline-block', fontSize: 11, padding: '2px 8px', borderRadius: 3, background: c.bg, color: c.fg }}>
      {texto}
    </span>
  );
}

export default function InfraccionesVelocidadView() {
  const { filas, cargando, error, recargar } = useInfraccionesVelocidad({ limite: 500 });
  const [busqueda, setBusqueda] = useState('');
  const [filtroSeveridad, setFiltroSeveridad] = useState('Todas');
  const [filtroZona, setFiltroZona] = useState('Todas');

  const enriquecidas = useMemo(
    () =>
      filas.map((f) => {
        const exceso = (f.velocidad ?? 0) - (f.limite ?? 0);
        return { ...f, exceso, severidad: severidad(exceso) };
      }),
    [filas]
  );

  const total = enriquecidas.length;
  const criticas = enriquecidas.filter((f) => f.severidad === 'Crítica').length;
  const moderadas = enriquecidas.filter((f) => f.severidad === 'Moderada').length;
  const leves = enriquecidas.filter((f) => f.severidad === 'Leve').length;
  const excesoMaximo = enriquecidas.reduce((max, f) => (f.exceso > max ? f.exceso : max), 0);
  const excesoPromedio = total > 0 ? enriquecidas.reduce((s, f) => s + f.exceso, 0) / total : 0;
  const velocidadPico = enriquecidas.reduce((max, f) => (f.velocidad > max ? f.velocidad : max), 0);

  const zonas = useMemo(
    () => ['Todas', ...new Set(enriquecidas.map((f) => f.zona_camion).filter(Boolean))],
    [enriquecidas]
  );

  const ranking = useMemo(() => {
    const porConductor = {};
    for (const f of enriquecidas) {
      const key = f.rut_conductor || f.nombre_conductor || 'Sin dato';
      if (!porConductor[key]) {
        porConductor[key] = { nombre: f.nombre_conductor, rut: f.rut_conductor, patente: f.patente, eventos: 0, excesoMax: 0 };
      }
      porConductor[key].eventos += 1;
      if (f.exceso > porConductor[key].excesoMax) porConductor[key].excesoMax = f.exceso;
    }
    return Object.values(porConductor)
      .sort((a, b) => b.eventos - a.eventos)
      .slice(0, 5);
  }, [enriquecidas]);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return enriquecidas.filter((f) => {
      if (filtroSeveridad !== 'Todas' && f.severidad !== filtroSeveridad) return false;
      if (filtroZona !== 'Todas' && f.zona_camion !== filtroZona) return false;
      if (q === '') return true;
      const campos = [f.patente, f.nombre_conductor, f.rut_conductor, f.ruta, f.codigo_vehiculo];
      return campos.some((c) => c && String(c).toLowerCase().includes(q));
    });
  }, [enriquecidas, busqueda, filtroSeveridad, filtroZona]);

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, background: 'var(--line)', border: '1px solid var(--line)', marginBottom: 24 }}>
        <div style={kpiBoxStyle}>
          <div style={kpiLabelStyle}>Total infracciones</div>
          <div className="num" style={kpiValueStyle}>{total}</div>
        </div>
        <div style={kpiBoxStyle}>
          <div style={kpiLabelStyle}>Críticas (&gt;20 km/h)</div>
          <div className="num" style={{ ...kpiValueStyle, color: 'var(--alert)' }}>{criticas}</div>
        </div>
        <div style={kpiBoxStyle}>
          <div style={kpiLabelStyle}>Exceso máximo registrado</div>
          <div className="num" style={kpiValueStyle}>+{excesoMaximo.toFixed(0)} km/h</div>
        </div>
        <div style={kpiBoxStyle}>
          <div style={kpiLabelStyle}>Exceso promedio</div>
          <div className="num" style={kpiValueStyle}>+{excesoPromedio.toFixed(1)} km/h</div>
        </div>
        <div style={kpiBoxStyle}>
          <div style={kpiLabelStyle}>Velocidad pico de flota</div>
          <div className="num" style={kpiValueStyle}>{velocidadPico} km/h</div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <ImportadorExcel config={configInfraccionesVelocidad} onCargaCompleta={recargar} />
      </div>

      {/* Mapa de calor — integrado en la misma página, sin pestaña propia */}
      <div style={{ marginBottom: 24 }}>
        <MapaCalorInfracciones filas={enriquecidas} ocultarKpis />
      </div>

      {/* Distribución + Ranking */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ background: '#fff', border: '1px solid var(--line)', padding: 20 }}>
          <h2 style={{ fontSize: 14.5, margin: '0 0 16px 0' }}>Distribución por nivel de severidad</h2>
          {['Crítica', 'Moderada', 'Leve'].map((nivel) => {
            const count = { Crítica: criticas, Moderada: moderadas, Leve: leves }[nivel];
            const pct = total > 0 ? (count / total) * 100 : 0;
            const c = severidadColor[nivel];
            return (
              <div key={nivel} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span>{nivel}</span>
                  <span className="num">{count} ({pct.toFixed(0)}%)</span>
                </div>
                <div style={{ height: 8, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: c.fg }} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--line)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
            <h2 style={{ fontSize: 14.5, margin: 0 }}>Ranking de conductores reincidentes</h2>
          </div>
          <div style={{ padding: '8px 20px' }}>
            {ranking.length === 0 && <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Sin datos.</p>}
            {ranking.map((r, i) => (
              <div key={r.rut || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < ranking.length - 1 ? '1px solid var(--line)' : 'none' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{r.nombre || 'Sin nombre'}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }} className="num">{r.rut} · {r.patente}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="num" style={{ fontSize: 13, fontWeight: 600 }}>{r.eventos} eventos</div>
                  <div className="num" style={{ fontSize: 11.5, color: 'var(--alert)' }}>Máx +{r.excesoMax.toFixed(0)} km/h</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla con filtros */}
      <div style={{ background: '#fff', border: '1px solid var(--line)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 14.5, margin: 0 }}>Auditoría detallada</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              placeholder="Buscar patente, conductor, RUT, ruta…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ padding: '7px 10px', border: '1px solid var(--line)', borderRadius: 4, fontSize: 13, minWidth: 220 }}
            />
            <select value={filtroSeveridad} onChange={(e) => setFiltroSeveridad(e.target.value)} style={{ padding: '7px 10px', border: '1px solid var(--line)', borderRadius: 4, fontSize: 13 }}>
              {['Todas', 'Crítica', 'Moderada', 'Leve'].map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={filtroZona} onChange={(e) => setFiltroZona(e.target.value)} style={{ padding: '7px 10px', border: '1px solid var(--line)', borderRadius: 4, fontSize: 13 }}>
              {zonas.map((z) => <option key={z}>{z}</option>)}
            </select>
          </div>
        </div>

        <div style={{ padding: 20, overflowX: 'auto' }}>
          {cargando && <p>Cargando…</p>}
          {error && <p style={{ color: 'var(--alert)' }}>Error: {error}</p>}
          {!cargando && !error && filtradas.length === 0 && (
            <p style={{ color: 'var(--ink-soft)' }}>Sin resultados para los filtros actuales.</p>
          )}
          {!cargando && !error && filtradas.length > 0 && (
            <>
              <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '0 0 10px 0' }}>
                Mostrando {Math.min(filtradas.length, 50)} de {filtradas.length} registros
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Vehículo</th>
                    <th style={thStyle}>Conductor / RUT</th>
                    <th style={thStyle}>Fecha</th>
                    <th className="num" style={{ ...thStyle, textAlign: 'right' }}>Vel. / Límite</th>
                    <th className="num" style={{ ...thStyle, textAlign: 'right' }}>Exceso</th>
                    <th style={thStyle}>Ruta</th>
                    <th style={thStyle}>Severidad</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.slice(0, 50).map((f) => (
                    <tr key={f.id_alarma}>
                      <td className="num" style={tdStyle}>{f.codigo_vehiculo} · {f.patente}</td>
                      <td style={tdStyle}>
                        <div>{f.nombre_conductor}</div>
                        <div className="num" style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>{f.rut_conductor}</div>
                      </td>
                      <td className="num" style={tdStyle}>{f.fecha_alarma?.replace('T', ' ').slice(0, 16)}</td>
                      <td className="num" style={{ ...tdStyle, textAlign: 'right' }}>{f.velocidad} / {f.limite}</td>
                      <td className="num" style={{ ...tdStyle, textAlign: 'right', color: 'var(--alert)' }}>+{f.exceso.toFixed(0)}</td>
                      <td style={{ ...tdStyle, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.ruta}</td>
                      <td style={tdStyle}><Tag texto={f.severidad} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
