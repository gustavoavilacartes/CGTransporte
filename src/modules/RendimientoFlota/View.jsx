import { useGiros } from '../../hooks/useGiros';
import ImportadorExcel from '../../components/ImportadorExcel';
import { configGiros } from '../../config/importConfig.giros';

function minutosEntre(inicioISO, finISO) {
  if (!inicioISO || !finISO) return null;
  const diffMs = new Date(finISO) - new Date(inicioISO);
  if (Number.isNaN(diffMs) || diffMs < 0) return null;
  return diffMs / 60000;
}

function promedio(valores) {
  const validos = valores.filter((v) => v !== null && v !== undefined && !Number.isNaN(v));
  if (validos.length === 0) return null;
  return validos.reduce((a, b) => a + b, 0) / validos.length;
}

const kpiBoxStyle = { background: '#fff', padding: '18px 20px' };
const kpiLabelStyle = { fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 10 };
const kpiValueStyle = { fontSize: 26, fontWeight: 600 };
const thStyle = { textAlign: 'left', padding: '8px 0', borderBottom: '1px solid var(--line)', color: 'var(--ink-soft)', fontWeight: 500, fontSize: 12 };
const tdStyle = { padding: '10px 0', borderBottom: '1px solid var(--line)' };

export default function RendimientoFlotaView() {
  const { filas, cargando, error, recargar } = useGiros({ limite: 500 });

  const girosReales = filas.filter((f) => f.estado_giro !== 'Cancelado');

  const kmPromedio = promedio(girosReales.map((f) => f.km_totales));
  const carguioPromedio = promedio(girosReales.map((f) => f.tiempo_carguio_min));
  const cicloPromedioMin = promedio(
    girosReales.map((f) => minutosEntre(f.fecha_llegada_origen, f.fecha_sale_destino))
  );

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--line)', border: '1px solid var(--line)', marginBottom: 24 }}>
        <div style={kpiBoxStyle}>
          <div style={kpiLabelStyle}>Km promedio por giro</div>
          <div className="num" style={kpiValueStyle}>{kmPromedio !== null ? kmPromedio.toFixed(1) : '—'}</div>
        </div>
        <div style={kpiBoxStyle}>
          <div style={kpiLabelStyle}>Carguío promedio (min)</div>
          <div className="num" style={kpiValueStyle}>{carguioPromedio !== null ? carguioPromedio.toFixed(0) : '—'}</div>
        </div>
        <div style={kpiBoxStyle}>
          <div style={kpiLabelStyle}>Ciclo promedio origen→destino (min)</div>
          <div className="num" style={kpiValueStyle}>{cicloPromedioMin !== null ? cicloPromedioMin.toFixed(0) : '—'}</div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <ImportadorExcel config={configGiros} onCargaCompleta={recargar} />
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--line)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
          <h2 style={{ fontSize: 14.5, margin: 0 }}>Últimos giros — detalle de ciclo</h2>
        </div>
        <div style={{ padding: 20, overflowX: 'auto' }}>
          {cargando && <p>Cargando…</p>}
          {error && <p style={{ color: 'var(--alert)' }}>Error: {error}</p>}
          {!cargando && !error && filas.length === 0 && (
            <p style={{ color: 'var(--ink-soft)' }}>Aún no hay datos cargados para este módulo.</p>
          )}
          {!cargando && !error && filas.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Giro</th>
                  <th style={thStyle}>Patente</th>
                  <th style={thStyle}>Origen</th>
                  <th style={thStyle}>Destino</th>
                  <th className="num" style={{ ...thStyle, textAlign: 'right' }}>Km</th>
                  <th className="num" style={{ ...thStyle, textAlign: 'right' }}>Carguío (min)</th>
                </tr>
              </thead>
              <tbody>
                {filas.slice(0, 50).map((f) => (
                  <tr key={f.id_giro}>
                    <td className="num" style={tdStyle}>{f.id_giro}</td>
                    <td className="num" style={tdStyle}>{f.patente}</td>
                    <td style={tdStyle}>{f.origen}</td>
                    <td style={tdStyle}>{f.destino}</td>
                    <td className="num" style={{ ...tdStyle, textAlign: 'right' }}>{f.km_totales ?? '—'}</td>
                    <td className="num" style={{ ...tdStyle, textAlign: 'right' }}>{f.tiempo_carguio_min ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
