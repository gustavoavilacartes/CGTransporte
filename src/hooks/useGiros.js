import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useGiros({ limite = 500 } = {}) {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('giros')
      .select('*')
      .order('fecha_llegada_origen', { ascending: false })
      .limit(limite);

    if (err) {
      setError(err.message);
      setFilas([]);
    } else {
      setFilas(data ?? []);
    }
    setCargando(false);
  }, [limite]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { filas, cargando, error, recargar };
}
