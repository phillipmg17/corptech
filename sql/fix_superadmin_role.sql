-- Insertar rol superadmin para phillipmg17@gmail.com
-- UUID: 29e84ece-2a42-4816-995d-aa855b79f4b4

INSERT INTO user_roles (user_id, role, org_id)
VALUES (
  '29e84ece-2a42-4816-995d-aa855b79f4b4',
  'superadmin',
  '00000000-0000-0000-0000-000000000001'
);

-- Confirmar
SELECT user_id, role, org_id FROM user_roles
WHERE user_id = '29e84ece-2a42-4816-995d-aa855b79f4b4';
