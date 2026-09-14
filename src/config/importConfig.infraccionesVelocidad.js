// Utilidades de parseo — formato chileno (coma decimal, fecha dd-mm-yyyy)

function parseDecimalCL(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const texto = String(valor).trim().replace(/\./g, '').replace(',', '.');
  const num = Number(texto);
  return Number.isNaN(num) ? null : num;
}

function parseEnteroCL(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const num = parseInt(String(valor).trim(), 10);
  return Number.isNaN(num) ? null : num;
}

function parseFechaCL(valor) {
  // Espera "DD-MM-YYYY HH:MM"
  if (!valor) return null;
  const texto = String(valor).trim();
  const match = texto.match(
    /^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})$/
  );
  if (!match) return null;
  const [, dd, mm, yyyy, hh, min] = match;
  // ISO 8601 — timestamp sin zona horaria, tal como viene el dato origen
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
