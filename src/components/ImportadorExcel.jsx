import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabaseClient';

/**
 * Importador genérico de Excel → Supabase.
 *
 * Props:
 *   config: { tabla, llaveUpsert: string[], columnas: { [headerExcel]: { campo, parser, requerido } } }
 *
 * Uso:
 *   <ImportadorExcel config={configInfraccionesVelocidad} onCargaCompleta={recargar} />
 */
export default function ImportadorExcel({ config, onCargaCompleta }) {
  const [estado, setEstado] = useState('idle'); // idle | leyendo | previsualizando | subiendo | listo | error
  const [filas, setFilas] = useState([]);
  const [errores, setErrores] = useState([]);
  const [resultado, setResultado] = useState(null);

  function validarEncabezados(headers) {
    const esperados = Object.keys(config.columnas);
    const faltantes = esperados.filter((h) => !headers.includes(h));
    return faltantes;
  }

  function transformarFila(filaExcel, indice) {
    const filaDB = {};
    const erroresFila = [];

    for (const [headerExcel, def] of Object.entries(config.columnas)) {
      const valorCrudo = filaExcel[headerExcel];
      const valorParseado = def.parser(valorCrudo);

      if (def.requerido && (valorParseado === null || valorParseado === undefined)) {
        erroresFila.push(
          `Fila ${indice + 2}: "${headerExcel}" es requerido y llegó vacío o inválido (valor original: "${valorCrudo}")`
        );
      }
      filaDB[def.campo] = valorParseado;
    }
    return { filaDB, erroresFila };
  }

  function manejarArchivo(e) {
    const archivo = e.target.files[0];
    if (!archivo) return;

    setEstado('leyendo');
    setErrores([]);
    setResultado(null);

    const lector = new FileReader();
    lector.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const primeraHoja = workbook.Sheets[workbook.SheetNames[0]];
        const filasCrudas = XLSX.utils.sheet_to_json(primeraHoja, { defval: null });

        if (filasCrudas.length === 0) {
          setErrores(['El archivo no tiene filas de datos.']);
          setEstado('error');
          return;
        }

        const headers = Object.keys(filasCrudas[0]);
        const faltantes = validarEncabezados(headers);
        if (faltantes.length > 0) {
          setErrores([
            `Faltan columnas esperadas en el Excel: ${faltantes.join(', ')}`,
          ]);
          setEstado('error');
          return;
        }

        const todosLosErrores = [];
        const filasTransformadas = filasCrudas.map((fila, i) => {
          const { filaDB, erroresFila } = transformarFila(fila, i);
          todosLosErrores.push(...erroresFila);
          return filaDB;
        });

        setFilas(filasTransformadas);
        setErrores(todosLosErrores);
        setEstado('previsualizando');
      } catch (err) {
        setErrores([`Error leyendo el archivo: ${err.message}`]);
        setEstado('error');
      }
    };
    lector.readAsArrayBuffer(archivo);
  }

  async function confirmarCarga() {
    setEstado('subiendo');
    const filasValidas = filas.filter((f) =>
      config.llaveUpsert.every((k) => f[k] !== null && f[k] !== undefined)
    );

    const { data, error } = await supabase
      .from(config.tabla)
      .upsert(filasValidas, { onConflict: config.llaveUpsert.join(',') })
      .select('id_alarma');

    if (error) {
      setErrores([`Error al subir a Supabase: ${error.message}`]);
      setEstado('error');
      return;
    }

    setResultado({
      totalFilas: filas.length,
      filasValidas: filasValidas.length,
      filasOmitidas: filas.length - filasValidas.length,
      filasInsertadasOActualizadas: data?.length ?? filasValidas.length,
    });
    setEstado('listo');
    onCargaCompleta?.();
  }

  function reiniciar() {
    setEstado('idle');
    setFilas([]);
    setErrores([]);
    setResultado(null);
  }

  return (
    <div style={{ border: '1px solid #D9D6CE', padding: 20, background: '#fff' }}>
      <h3 style={{ marginTop: 0, fontSize: 14.5 }}>
        Importar Excel — {config.tabla}
      </h3>

      {estado === 'idle' && (
        <input type="file" accept=".xlsx,.xls" onChange={manejarArchivo} />
      )}

      {estado === 'leyendo' && <p>Leyendo archivo…</p>}

      {estado === 'previsualizando' && (
        <div>
          <p>
            {filas.length} filas leídas.{' '}
            {errores.length > 0 && (
              <span style={{ color: '#B5502D' }}>
                {errores.length} advertencias/errores encontrados.
              </span>
            )}
          </p>
          {errores.length > 0 && (
            <ul style={{ maxHeight: 180, overflowY: 'auto', fontSize: 12.5, color: '#B5502D' }}>
              {errores.slice(0, 30).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
              {errores.length > 30 && <li>… y {errores.length - 30} más</li>}
            </ul>
          )}
          <button onClick={confirmarCarga}>Confirmar carga</button>{' '}
          <button onClick={reiniciar}>Cancelar</button>
        </div>
      )}

      {estado === 'subiendo' && <p>Subiendo a Supabase…</p>}

      {estado === 'listo' && resultado && (
        <div>
          <p style={{ color: '#2F4538' }}>
            Carga completa: {resultado.filasInsertadasOActualizadas} filas
            insertadas/actualizadas de {resultado.totalFilas} leídas
            {resultado.filasOmitidas > 0 &&
              ` (${resultado.filasOmitidas} omitidas por datos inválidos en la llave)`}
            .
          </p>
          <button onClick={reiniciar}>Cargar otro archivo</button>
        </div>
      )}

      {estado === 'error' && (
        <div>
          <ul style={{ color: '#B5502D', fontSize: 13 }}>
            {errores.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
          <button onClick={reiniciar}>Reintentar</button>
        </div>
      )}
    </div>
  );
}
