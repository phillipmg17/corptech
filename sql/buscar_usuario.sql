-- Ver TODOS los usuarios registrados en Supabase Auth
SELECT id, email, created_at, last_sign_in_at
FROM auth.users
ORDER BY last_sign_in_at DESC NULLS LAST;
