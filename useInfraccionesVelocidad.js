import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useInfraccionesVelocidad({ limite = 50 } = {}) {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('infracciones_velocidad')
      .select('*')
      .order('fecha_alarma', { ascending: false })
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
