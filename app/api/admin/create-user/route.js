import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// ── Admin client con service role (solo server-side) ──────────
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req) {
  try {
    const { full_name, email, password, role, org_id } = await req.json();

    // Validaciones básicas
    if (!full_name || !email || !password || !role || !org_id) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }
    if (!['store_admin', 'vendedor'].includes(role)) {
      return NextResponse.json({ error: 'Rol no permitido' }, { status: 403 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Contraseña muy corta (mínimo 6 caracteres)' }, { status: 400 });
    }

    // 1. Crear el usuario en auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // 2. Insertar en public.users
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({ id: userId, full_name, email, org_id })
      .single();

    if (userError && userError.code !== '23505') { // ignorar duplicate
      console.error('Error inserting user:', userError);
    }

    // 3. Asignar rol con org_id de la tienda
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: userId, role, org_id });

    if (roleError && roleError.code !== '23505') {
      console.error('Error inserting role:', roleError);
    }

    return NextResponse.json({
      ok: true,
      userId,
      message: `✅ ${full_name} creado con rol ${role}`,
    });

  } catch (err) {
    console.error('create-user error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
