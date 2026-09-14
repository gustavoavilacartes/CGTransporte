// Utilidades de parseo — formato chileno (coma decimal, fecha dd-mm-yyyy)

function parseDecimalCL(valor) {
  if (valor === null || valor === undefined || valor === '') return null;

  // Si SheetJS ya entregó un número (celda con formato numérico), se usa tal cual
  if (typeof valor === 'number') return valor;

  const texto = String(valor).trim().replace(/\./g, '').replace(',', '.');
  const num = Number(texto);
  return Number.isNaN(num) ? null : num;
}

function parseEnteroCL(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  if (typeof valor === 'number') return Math.round(valor);
  const num = parseInt(String(valor).trim(), 10);
  return Number.isNaN(num) ? null : num;
}

function parseFechaCL(valor) {
  if (valor === null || valor === undefined || valor === '') return null;

  // Caso 1: SheetJS ya entregó un objeto Date (cellDates: true)
  if (valor instanceof Date) {
    return formatearFechaISO(valor);
  }

  // Caso 2: número serial de Excel (columna con formato fecha pero
  // sheet_to_json no lo convirtió) — ej. 46365.629340...
  if (typeof valor === 'number') {
    const fecha = new Date(Math.round((valor - 25569) * 86400 * 1000));
    return formatearFechaISO(fecha);
  }

  // Caso 3: texto "DD-MM-YYYY HH:MM"
  const texto = String(valor).trim();
  const match = texto.match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})$/);
  if (match) {
    const [, dd, mm, yyyy, hh, min] = match;
    return `${yyyy}-${mm}-${dd}T${hh}:${min}:00`;
  }
  return null;
}

function formatearFechaISO(date) {
  // Usa componentes UTC: el serial de Excel no tiene zona horaria propia,
  // y tanto la conversión manual como cellDates de SheetJS son UTC-based.
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:00`;
}

function parseTexto(valor) {
  if (valor === null || valor === undefined) return null;
  const texto = String(valor).trim();
  return texto === '' ? null : texto;
}

export const configInfraccionesVelocidad = {
  tabla: 'infracciones_velocidad',
  llaveUpsert: ['id_alarma'],

  // columnaExcel -> { campo (columna DB), parser }
  columnas: {
    'ID ALARMA': { campo: 'id_alarma', parser: parseEnteroCL, requerido: true },
    'TIPO ALARMA': { campo: 'tipo_alarma', parser: parseTexto },
    'REFERENCIA': { campo: 'referencia', parser: parseTexto },
    'DETALLE ALARMA': { campo: 'detalle_alarma', parser: parseTexto },
    'NUMERO_DE_EVENTOS': { campo: 'numero_eventos', parser: parseEnteroCL },
    'CODIGO': { campo: 'codigo_vehiculo', parser: parseTexto },
    'PATENTE': { campo: 'patente', parser: parseTexto, requerido: true },
    'FECHA ALARMA': { campo: 'fecha_alarma', parser: parseFechaCL, requerido: true },
    'ID Giro': { campo: 'id_giro', parser: parseEnteroCL },
    'LONGITUD': { campo: 'longitud', parser: parseDecimalCL },
    'LATITUD': { campo: 'latitud', parser: parseDecimalCL },
    'ZONA': { campo: 'zona_camion', parser: parseTexto },
    'VELOCIDAD': { campo: 'velocidad', parser: parseDecimalCL },
    'LIMITE': { campo: 'limite', parser: parseDecimalCL },
    'HOLGURA': { campo: 'holgura', parser: parseDecimalCL },
    'RUTA': { campo: 'ruta', parser: parseTexto },
    'RUT_CONDUCTOR': { campo: 'rut_conductor', parser: parseTexto },
    'NOMBRE_CONDUCTOR': { campo: 'nombre_conductor', parser: parseTexto },
    'EMPRESARIO': { campo: 'empresa', parser: parseTexto },
  },
};
