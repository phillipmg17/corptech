'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SuperadminPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/');
    });
  }, []);

  async function doLogout() {
    await supabase.auth.signOut();
    router.replace('/');
  }

  return (
    <div className="auth-screen" style={{ flexDirection: 'column', gap: 20 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>⚡</div>
        <div style={{ fontSize: 26, fontWeight: 900 }}>SuperAdmin</div>
        <div style={{ color: 'var(--text3)', marginTop: 4, marginBottom: 32 }}>Panel en construcción</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
        <Link href="/corp"      className="btn btn-outline" style={{ justifyContent: 'center', textDecoration: 'none' }}>🏢 Panel Corp</Link>
        <Link href="/store"     className="btn btn-outline" style={{ justifyContent: 'center', textDecoration: 'none' }}>🏪 Panel Tienda</Link>
        <Link href="/pos"       className="btn btn-outline" style={{ justifyContent: 'center', textDecoration: 'none' }}>🛒 Punto de Venta</Link>
        <Link href="/dashboard" className="btn btn-outline" style={{ justifyContent: 'center', textDecoration: 'none' }}>📊 Dashboard</Link>
        <button className="btn btn-red" onClick={doLogout}>Cerrar sesión</button>
      </div>
    </div>
  );
}
