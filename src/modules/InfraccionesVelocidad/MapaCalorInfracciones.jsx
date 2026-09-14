import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

const CAPAS_BASE = {
  satelite: {
    label: 'Satélite ESRI',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © Esri',
  },
  claro: {
    label: 'Mapa claro',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap, © CARTO',
  },
};

const severidadColorHex = { Crítica: '#B5502D', Moderada: '#C98A2E', Leve: '#2F4538' };

function severidad(exceso) {
  if (exceso > 20) return 'Crítica';
  if (exceso >= 10) return 'Moderada';
  return 'Leve';
}

export default function MapaCalorInfracciones({ filas }) {
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const heatLayerRef = useRef(null);
  const puntosLayerRef = useRef(null);
  const capaBaseRef = useRef(null);

  const [capaBase, setCapaBase] = useState('satelite');
  const [radio, setRadio] = useState(32);
  const [mostrarCalor, setMostrarCalor] = useState(true);
  const [mostrarPuntos, setMostrarPuntos] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos'); // todos | criticos

  const puntos = useMemo(
    () =>
      filas
        .filter((f) => f.latitud && f.longitud)
        .map((f) => {
          const exceso = (f.velocidad ?? 0) - (f.limite ?? 0);
          return { ...f, exceso, severidad: severidad(exceso) };
        }),
    [filas]
  );

  // Agrupación por ruta como proxy de "tramo/segmento"
  const tramos = useMemo(() => {
    const grupos = {};
    for (const p of puntos) {
      const key = p.ruta || 'Sin ruta registrada';
      if (!grupos[key]) {
        grupos[key] = { ruta: key, eventos: 0, maxVel: 0, limite: p.limite, lat: p.latitud, lng: p.longitud };
      }
      grupos[key].eventos += 1;
      if (p.velocidad > grupos[key].maxVel) grupos[key].maxVel = p.velocidad;
    }
    return Object.values(grupos).sort((a, b) => b.eventos - a.eventos);
  }, [puntos]);

  const tramosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return tramos.filter((t) => {
      if (filtro === 'criticos' && t.maxVel - t.limite <= 20) return false;
      if (q === '') return true;
      return t.ruta.toLowerCase().includes(q);
    });
  }, [tramos, busqueda, filtro]);

  const tramoTop = tramos[0];

  // Inicializar mapa una sola vez
  useEffect(() => {
    if (mapRef.current || !mapDivRef.current) return;
    const map = L.map(mapDivRef.current, { zoomControl: false }).setView([-37.4, -73.0], 8);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapRef.current = map;
    capaBaseRef.current = L.tileLayer(CAPAS_BASE.satelite.url, { attribution: CAPAS_BASE.satelite.attribution }).addTo(map);

    // El contenedor puede no tener su altura final calculada en el primer
    // render (layout con grid/flex) — nos suscribimos a sus cambios de
    // tamaño para mantener el mapa siempre correctamente dimensionado.
    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(mapDivRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Cambiar capa base
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (capaBaseRef.current) map.removeLayer(capaBaseRef.current);
    const cfg = CAPAS_BASE[capaBase];
    capaBaseRef.current = L.tileLayer(cfg.url, { attribution: cfg.attribution }).addTo(map);
  }, [capaBase]);

  // Capa de calor
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }
    if (mostrarCalor && puntos.length > 0) {
      const pesos = puntos.map((p) => [p.latitud, p.longitud, Math.min(1, Math.max(0.2, p.exceso / 40))]);
      heatLayerRef.current = L.heatLayer(pesos, { radius: Number(radio), blur: 20, maxZoom: 14 }).addTo(map);
    }
  }, [puntos, mostrarCalor, radio]);

  // Puntos GPS individuales
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (puntosLayerRef.current) {
      map.removeLayer(puntosLayerRef.current);
      puntosLayerRef.current = null;
    }
    if (mostrarPuntos && puntos.length > 0) {
      const grupo = L.layerGroup();
      puntos.forEach((p) => {
        const color = severidadColorHex[p.severidad];
        const marcador = L.circleMarker([p.latitud, p.longitud], {
          radius: 5,
          color,
          fillColor: color,
          fillOpacity: 0.85,
          weight: 1,
        });
        marcador.bindPopup(
          `<strong>${p.patente ?? ''}</strong> · ${p.nombre_conductor ?? ''}<br/>` +
          `${p.velocidad ?? '—'} km/h (límite ${p.limite ?? '—'})<br/>` +
          `${p.ruta ?? ''}<br/>` +
          `<span style="color:${color}">${p.severidad}</span>`
        );
        marcador.addTo(grupo);
      });
      grupo.addTo(map);
      puntosLayerRef.current = grupo;

      // Aseguramos el tamaño real del contenedor antes de calcular el
      // encuadre — si el mapa aún cree tener un tamaño incorrecto (0 o
      // distinto al real), fitBounds calcula un zoom equivocado de forma
      // permanente, aunque el renderizado de tiles se vea "arreglado" después.
      map.invalidateSize();
      const bounds = L.latLngBounds(puntos.map((p) => [p.latitud, p.longitud]));
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [puntos, mostrarPuntos]);

  function irATramo(t) {
    if (mapRef.current && t.lat && t.lng) {
      mapRef.current.setView([t.lat, t.lng], 14, { animate: true });
    }
  }

  const inputStyle = { padding: '7px 10px', border: '1px solid var(--line)', borderRadius: 4, fontSize: 13 };

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'var(--line)', border: '1px solid var(--line)', marginBottom: 16 }}>
        <div style={{ background: '#fff', padding: '16px 20px' }}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 8 }}>Infracciones georreferenciadas</div>
          <div className="num" style={{ fontSize: 24, fontWeight: 600 }}>{puntos.length}</div>
        </div>
        <div style={{ background: '#fff', padding: '16px 20px' }}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 8 }}>Excesos críticos (&gt;20 km/h)</div>
          <div className="num" style={{ fontSize: 24, fontWeight: 600, color: 'var(--alert)' }}>
            {puntos.filter((p) => p.severidad === 'Crítica').length}
          </div>
        </div>
        <div style={{ background: '#fff', padding: '16px 20px' }}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 8 }}>Pico máximo de velocidad</div>
          <div className="num" style={{ fontSize: 24, fontWeight: 600 }}>
            {puntos.reduce((m, p) => (p.velocidad > m ? p.velocidad : m), 0)} km/h
          </div>
        </div>
        <div style={{ background: '#fff', padding: '16px 20px' }}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 8 }}>Tramo con mayor incidencia</div>
          <div style={{ fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {tramoTop ? tramoTop.ruta : '—'}
          </div>
          {tramoTop && <div className="num" style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>{tramoTop.eventos} eventos</div>}
        </div>
      </div>

      {/* Controles */}
      <div style={{ background: '#fff', border: '1px solid var(--line)', borderBottom: 'none', padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <div>
          <label style={{ fontSize: 12, color: 'var(--ink-soft)', marginRight: 6 }}>Capa base:</label>
          <select value={capaBase} onChange={(e) => setCapaBase(e.target.value)} style={inputStyle}>
            {Object.entries(CAPAS_BASE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Radio: {radio}px</label>
          <input type="range" min="10" max="60" value={radio} onChange={(e) => setRadio(e.target.value)} />
        </div>
        <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={mostrarCalor} onChange={(e) => setMostrarCalor(e.target.checked)} /> Capa térmica
        </label>
        <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={mostrarPuntos} onChange={(e) => setMostrarPuntos(e.target.checked)} /> Puntos GPS
        </label>
        <span style={{ fontSize: 12, color: 'var(--ink-soft)', marginLeft: 'auto' }}>Haz clic en un punto GPS para auditar el evento</span>
      </div>

      {/* Mapa + sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gridTemplateRows: '480px', border: '1px solid var(--line)', height: 480 }}>
        <div style={{ borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: 480 }}>
          <div style={{ padding: 14, borderBottom: '1px solid var(--line)' }}>
            <input
              placeholder="Buscar ruta o tramo…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ ...inputStyle, width: '100%', marginBottom: 8 }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setFiltro('todos')}
                style={{ flex: 1, padding: '6px 0', fontSize: 12, border: '1px solid var(--line)', borderRadius: 4, background: filtro === 'todos' ? 'var(--primary)' : '#fff', color: filtro === 'todos' ? '#fff' : 'var(--ink)' }}
              >
                Todos ({tramos.length})
              </button>
              <button
                onClick={() => setFiltro('criticos')}
                style={{ flex: 1, padding: '6px 0', fontSize: 12, border: '1px solid var(--line)', borderRadius: 4, background: filtro === 'criticos' ? 'var(--alert)' : '#fff', color: filtro === 'criticos' ? '#fff' : 'var(--ink)' }}
              >
                Críticos
              </button>
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {tramosFiltrados.length === 0 && (
              <p style={{ padding: 14, fontSize: 12.5, color: 'var(--ink-soft)' }}>Sin tramos para este filtro.</p>
            )}
            {tramosFiltrados.map((t) => {
              const exceso = t.maxVel - (t.limite ?? 0);
              const nivel = exceso > 20 ? 'Extremo' : exceso >= 10 ? 'Crítico' : 'Moderado';
              const nivelColor = exceso > 20 ? 'var(--alert)' : exceso >= 10 ? '#C98A2E' : 'var(--primary)';
              return (
                <div
                  key={t.ruta}
                  onClick={() => irATramo(t)}
                  style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.3 }}>{t.ruta}</span>
                    <span style={{ fontSize: 10.5, padding: '2px 6px', borderRadius: 3, background: nivelColor, color: '#fff', whiteSpace: 'nowrap' }}>{nivel}</span>
                  </div>
                  <div className="num" style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 4 }}>
                    Límite {t.limite ?? '—'} km/h · Máx {t.maxVel} km/h · {t.eventos} eventos
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div ref={mapDivRef} style={{ height: 480, width: '100%' }} />
      </div>
    </div>
  );
}
