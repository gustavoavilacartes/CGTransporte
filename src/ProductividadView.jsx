import { useGiros } from '../../hooks/useGiros';

const kpiBoxStyle = { background: '#fff', padding: '18px 20px' };
const kpiLabelStyle = { fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 10 };
const kpiValueStyle = { fontSize: 26, fontWeight: 600 };
const thStyle = { textAlign: 'left', padding: '8px 0', borderBottom: '1px solid var(--line)', color: 'var(--ink-soft)', fontWeight: 500, fontSize: 12 };
const tdStyle = { padding: '10px 0', borderBottom: '1px solid var(--line)' };

function contarPorLlave(filas, llave) {
  const conteo = {};
  for (const f of filas) {
    const valor = f[llave] || 'Sin dato';
    conteo[valor] = (conteo[valor] || 0) + 1;
  }
  return Object.entries(conteo).sort((a, b) => b[1] - a[1]);
}

export default function ProductividadView() {
  const { filas, cargando, error } = useGiros({ limite: 500 });

  const totalGiros = filas.length;
  const completados = filas.filter((f) => f.estado_giro === 'Completado' || f.estado_giro === 'Cerrado').length;
  const cancelados = filas.filter((f) => f.estado_giro === 'Cancelado').length;

  const rankingCamiones = contarPorLlave(filas, 'patente').slice(0, 10);
  const causasPerdida = contarPorLlave(
    filas.filter((f) => f.grupo_causal),
    'grupo_causal'
  );

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--line)', border: '1px solid var(--line)', marginBottom: 24 }}>
        <div style={kpiBoxStyle}>
          <div style={kpiLabelStyle}>Giros totales (cargados)</div>
          <div className="num" style={kpiValueStyle}>{totalGiros}</div>
        </div>
        <div style={kpiBoxStyle}>
          <div style={kpiLabelStyle}>Completados</div>
          <div className="num" style={kpiValueStyle}>{completados}</div>
        </div>
        <div style={kpiBoxStyle}>
          <div style={kpiLabelStyle}>Cancelados</div>
          <div className="num" style={{ ...kpiValueStyle, color: cancelados > 0 ? 'var(--alert)' : 'var(--ink)' }}>{cancelados}</div>
        </div>
      </div>

      <div style={{ color: 'var(--ink-soft)', fontSize: 12.5, marginBottom: 20 }}>
        Los datos de este módulo se cargan desde <strong>Rendimiento de flota</strong> (misma fuente: reporte de Giros).
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        <div style={{ background: '#fff', border: '1px solid var(--line)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
            <h2 style={{ fontSize: 14.5, margin: 0 }}>Ranking de giros por camión</h2>
          </div>
          <div style={{ padding: 20, overflowX: 'auto' }}>
            {cargando && <p>Cargando…</p>}
            {error && <p style={{ color: 'var(--alert)' }}>Error: {error}</p>}
            {!cargando && !error && rankingCamiones.length === 0 && (
              <p style={{ color: 'var(--ink-soft)' }}>Aún no hay datos cargados para este módulo.</p>
            )}
            {!cargando && !error && rankingCamiones.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Patente</th>
                    <th className="num" style={{ ...thStyle, textAlign: 'right' }}>Giros</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingCamiones.map(([patente, count]) => (
                    <tr key={patente}>
                      <td className="num" style={tdStyle}>{patente}</td>
                      <td className="num" style={{ ...tdStyle, textAlign: 'right' }}>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--line)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
            <h2 style={{ fontSize: 14.5, margin: 0 }}>Principales causas de pérdida</h2>
          </div>
          <div style={{ padding: 20 }}>
            {!cargando && !error && causasPerdida.length === 0 && (
              <p style={{ color: 'var(--ink-soft)' }}>Sin eventos causales registrados.</p>
            )}
            {!cargando && !error && causasPerdida.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Causa</th>
                    <th className="num" style={{ ...thStyle, textAlign: 'right' }}>Eventos</th>
                  </tr>
                </thead>
                <tbody>
                  {causasPerdida.map(([causa, count]) => (
                    <tr key={causa}>
                      <td style={tdStyle}>{causa}</td>
                      <td className="num" style={{ ...tdStyle, textAlign: 'right' }}>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
