// Utilidades de parseo — mismo criterio que infracciones_velocidad
// (SheetJS puede entregar Date, número serial, o texto según el formato de celda)

function parseTexto(valor) {
  if (valor === null || valor === undefined) return null;
  const texto = String(valor).trim();
  return texto === '' ? null : texto;
}

function parseEnteroCL(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  if (typeof valor === 'number') return Math.round(valor);
  const num = parseInt(String(valor).trim(), 10);
  return Number.isNaN(num) ? null : num;
}

function parseDecimalCL(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  if (typeof valor === 'number') return valor;
  const texto = String(valor).trim().replace(/\./g, '').replace(',', '.');
  const num = Number(texto);
  return Number.isNaN(num) ? null : num;
}

function formatearFechaISO(date) {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:00`;
}

function parseFechaCL(valor) {
  if (valor === null || valor === undefined || valor === '') return null;

  if (valor instanceof Date) {
    return formatearFechaISO(valor);
  }
  if (typeof valor === 'number') {
    const fecha = new Date(Math.round((valor - 25569) * 86400 * 1000));
    return formatearFechaISO(fecha);
  }
  const texto = String(valor).trim();
  const match = texto.match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})$/);
  if (match) {
    const [, dd, mm, yyyy, hh, min] = match;
    return `${yyyy}-${mm}-${dd}T${hh}:${min}:00`;
  }
  return null;
}

// Duraciones tipo "00:30" — pueden venir como texto, como Date (hora pura,
// época 1899-12-30) o como número (fracción de día, ej. 0.5 = 12:00).
function parseDuracionMinutos(valor) {
  if (valor === null || valor === undefined || valor === '') return null;

  if (valor instanceof Date) {
    return valor.getUTCHours() * 60 + valor.getUTCMinutes();
  }
  if (typeof valor === 'number') {
    return Math.round(valor * 24 * 60);
  }
  const texto = String(valor).trim();
  const match = texto.match(/^(\d{1,3}):(\d{2})$/);
  if (match) {
    const [, hh, mm] = match;
    return parseInt(hh, 10) * 60 + parseInt(mm, 10);
  }
  return null;
}

export const configGiros = {
  tabla: 'giros',
  llaveUpsert: ['id_giro'],

  columnas: {
    'Giro': { campo: 'id_giro', parser: parseEnteroCL, requerido: true },
    'Proyecto': { campo: 'proyecto', parser: parseTexto },
    'Tipo_Giro': { campo: 'tipo_giro', parser: parseTexto },
    'Estado_Giro': { campo: 'estado_giro', parser: parseTexto },
    'Tipo_Cierre': { campo: 'tipo_cierre', parser: parseTexto },

    'Patente_Real': { campo: 'patente', parser: parseTexto },
    'Categoria_Real': { campo: 'categoria', parser: parseTexto },
    'Zona_Camion_Real': { campo: 'zona_camion', parser: parseTexto },
    'Emsefor_Transporte_Plan': { campo: 'empresa_transporte', parser: parseTexto },

    'Producto_Real': { campo: 'producto', parser: parseTexto },
    'Clase_Material_Real': { campo: 'clase_material', parser: parseTexto },
    'Volumen_Real': { campo: 'volumen', parser: parseDecimalCL },
    'Nombre_Origen_Real': { campo: 'origen', parser: parseTexto },
    'Nombre_Destino_Real': { campo: 'destino', parser: parseTexto },
    'Grua_Carga_Real': { campo: 'grua_carga', parser: parseTexto },
    'Grua_Descarga_Real': { campo: 'grua_descarga', parser: parseTexto },

    'Fecha_Llegada_Origen_Real': { campo: 'fecha_llegada_origen', parser: parseFechaCL },
    'Fecha_Carga_Real': { campo: 'fecha_carga', parser: parseFechaCL },
    'Fecha_Sale_Origen_Real': { campo: 'fecha_sale_origen', parser: parseFechaCL },
    'Fecha_Llegada_Destino_Real': { campo: 'fecha_llegada_destino', parser: parseFechaCL },
    'Fecha_Descarga_Real': { campo: 'fecha_descarga', parser: parseFechaCL },
    'Fecha_Sale_Destino_Real': { campo: 'fecha_sale_destino', parser: parseFechaCL },
    'Tiempo_Carguio': { campo: 'tiempo_carguio_min', parser: parseDuracionMinutos },

    'Km_Totales_Real': { campo: 'km_totales', parser: parseDecimalCL },
    'Km_Ripio_Real': { campo: 'km_ripio', parser: parseDecimalCL },
    'Km_Tierra_Real': { campo: 'km_tierra', parser: parseDecimalCL },
    'Km_Pavimento_Real': { campo: 'km_pavimento', parser: parseDecimalCL },

    'Responsable_Evento': { campo: 'responsable_evento', parser: parseTexto },
    'Descripcion_Evento': { campo: 'descripcion_evento', parser: parseTexto },
    'Grupo_Causal': { campo: 'grupo_causal', parser: parseTexto },
    'Fecha_Evento': { campo: 'fecha_evento', parser: parseFechaCL },
  },
};
