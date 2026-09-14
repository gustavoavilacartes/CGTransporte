import { useInfraccionesVelocidad } from '../../hooks/useInfraccionesVelocidad';
import ImportadorExcel from '../../components/ImportadorExcel';
import { configInfraccionesVelocidad } from '../../config/importConfig.infraccionesVelocidad';

export default function InfraccionesVelocidadView() {
  const { filas, cargando, error, recargar } = useInfraccionesVelocidad({ limite: 50 });

  const totalInfracciones = filas.length;
  const camionesUnicos = new Set(filas.map((f) => f.patente)).size;
  const velocidadMaxima = filas.reduce(
    (max, f) => (f.velocidad > max ? f.velocidad : max),
    0
  );

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--line)', border: '1px solid var(--line)', marginBottom: 24 }}>
        <div style={{ background: '#fff', padding: '18px 20px' }}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 10 }}>Infracciones (últimas {totalInfracciones})</div>
          <div className="num" style={{ fontSize: 26, fontWeight: 600 }}>{totalInfracciones}</div>
        </div>
        <div style={{ background: '#fff', padding: '18px 20px' }}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 10 }}>Camiones involucrados</div>
          <div className="num" style={{ fontSize: 26, fontWeight: 600 }}>{camionesUnicos}</div>
        </div>
        <div style={{ background: '#fff', padding: '18px 20px' }}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 10 }}>Velocidad máxima registrada</div>
          <div className="num" style={{ fontSize: 26, fontWeight: 600 }}>{velocidadMaxima} km/h</div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <ImportadorExcel config={configInfraccionesVelocidad} onCargaCompleta={recargar} />
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--line)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
          <h2 style={{ fontSize: 14.5, margin: 0 }}>Últimas infracciones registradas</h2>
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
                  <th style={{ textAlign: 'left', padding: '8px 0', borderBottom: '1px solid var(--line)', color: 'var(--ink-soft)', fontWeight: 500, fontSize: 12 }}>Fecha</th>
                  <th style={{ textAlign: 'left', padding: '8px 0', borderBottom: '1px solid var(--line)', color: 'var(--ink-soft)', fontWeight: 500, fontSize: 12 }}>Patente</th>
                  <th style={{ textAlign: 'left', padding: '8px 0', borderBottom: '1px solid var(--line)', color: 'var(--ink-soft)', fontWeight: 500, fontSize: 12 }}>Conductor</th>
                  <th style={{ textAlign: 'left', padding: '8px 0', borderBottom: '1px solid var(--line)', color: 'var(--ink-soft)', fontWeight: 500, fontSize: 12 }}>Empresa</th>
                  <th className="num" style={{ textAlign: 'right', padding: '8px 0', borderBottom: '1px solid var(--line)', color: 'var(--ink-soft)', fontWeight: 500, fontSize: 12 }}>Vel.</th>
                  <th className="num" style={{ textAlign: 'right', padding: '8px 0', borderBottom: '1px solid var(--line)', color: 'var(--ink-soft)', fontWeight: 500, fontSize: 12 }}>Límite</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.id_alarma}>
                    <td className="num" style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>{f.fecha_alarma?.replace('T', ' ').slice(0, 16)}</td>
                    <td className="num" style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>{f.patente}</td>
                    <td style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>{f.nombre_conductor}</td>
                    <td style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>{f.empresa}</td>
                    <td className="num" style={{ padding: '10px 0', borderBottom: '1px solid var(--line)', textAlign: 'right' }}>{f.velocidad}</td>
                    <td className="num" style={{ padding: '10px 0', borderBottom: '1px solid var(--line)', textAlign: 'right' }}>{f.limite}</td>
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
