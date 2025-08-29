-- SQL Script to Create Super Admin
-- Execute in PostgreSQL after running auth.seeder.ts

-- Step 1: Verify roles and permissions exist
SELECT 
  'Checking SUPER_ADMIN role' as info,
  CASE 
    WHEN EXISTS (SELECT 1 FROM roles WHERE name = 'super_admin') THEN 'Exists'
    ELSE 'Not found - Run auth.seeder.ts first'
  END as status;

SELECT 
  'Checking basic permissions' as info,
  COUNT(*) as total_permissions
FROM permissions 
WHERE name IN ('user:create', 'user:read', 'user:update', 'user:delete', 'user:list');

-- Step 2: Create Super Admin user
DO $$
DECLARE
  v_username VARCHAR(50) := COALESCE(current_setting('app.super_admin_username', true), 'admin');
  v_email VARCHAR(255) := COALESCE(current_setting('app.super_admin_email', true), 'admin@example.com');
  v_password VARCHAR(255) := COALESCE(current_setting('app.super_admin_password', true), 'admin123');
  v_first_name VARCHAR(100) := COALESCE(current_setting('app.super_admin_first_name', true), 'Super');
  v_last_name VARCHAR(100) := COALESCE(current_setting('app.super_admin_last_name', true), 'Admin');
BEGIN
  INSERT INTO users (
    id,
    username,
    email,
    password,
    "firstName",
    "lastName",
    type,
    status,
    "emailVerified",
    "phoneVerified",
    "isVerified",
    "createdAt",
    "updatedAt"
  ) VALUES (
    gen_random_uuid(),
    v_username,
    v_email,
    crypt(v_password, gen_salt('bf', 12)),
    v_first_name,
    v_last_name,
    'system',
    'active',
    true,
    false,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ) ON CONFLICT (username) DO NOTHING;
  
  RAISE NOTICE 'Super Admin user created: % (% %)', v_username, v_first_name, v_last_name;
END $$;

-- Step 3: Assign SUPER_ADMIN role
DO $$
DECLARE
  user_id UUID;
  role_id UUID;
  v_username VARCHAR(50) := COALESCE(current_setting('app.super_admin_username', true), 'admin');
BEGIN
  SELECT id INTO user_id FROM users WHERE username = v_username;
  SELECT id INTO role_id FROM roles WHERE name = 'super_admin';
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User % not found', v_username;
  END IF;
  
  IF role_id IS NULL THEN
    RAISE EXCEPTION 'SUPER_ADMIN role not found. Run auth.seeder.ts first';
  END IF;
  
  INSERT INTO user_roles (user_id, role_id)
  VALUES (user_id, role_id)
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Super Admin created successfully: %', user_id;
END $$;

-- Step 4: Verify creation
DO $$
DECLARE
  v_username VARCHAR(50) := COALESCE(current_setting('app.super_admin_username', true), 'admin');
BEGIN
  PERFORM set_config('app.super_admin_username', v_username, false);
  
  SELECT 
    'Super Admin User' as info,
    u.username,
    u.email,
    u.type,
    u.status,
    u."emailVerified",
    u."isVerified",
    u."createdAt"
  FROM users u
  WHERE u.username = v_username;
END $$;

DO $$
DECLARE
  v_username VARCHAR(50) := COALESCE(current_setting('app.super_admin_username', true), 'admin');
BEGIN
  SELECT 
    'Super Admin Roles' as info,
    u.username,
    r.name as role_name,
    r."displayName" as role_display,
    r.description as role_description
  FROM users u
  JOIN user_roles ur ON u.id = ur.user_id
  JOIN roles r ON ur.role_id = r.id
  WHERE u.username = v_username;
END $$;

DO $$
DECLARE
  v_username VARCHAR(50) := COALESCE(current_setting('app.super_admin_username', true), 'admin');
BEGIN
  SELECT 
    'Super Admin Permissions' as info,
    u.username,
    COUNT(DISTINCT p.name) as total_permissions
  FROM users u
  JOIN user_roles ur ON u.id = ur.user_id
  JOIN roles r ON ur.role_id = r.id
  JOIN role_permissions rp ON r.id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE u.username = v_username
  GROUP BY u.username;
END $$;

-- Step 5: Final summary
SELECT 
  'FINAL SUMMARY' as info,
  'Super Admin created successfully' as status;

SELECT 
  'ACCESS CREDENTIALS' as info,
  'Check environment variables' as username,
  'SUPER_ADMIN_USERNAME, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD' as email,
  'Configure in .env file' as password;

SELECT 
  'ACCESS' as info,
  'User with full system access' as description;

/*
POST-EXECUTION INSTRUCTIONS:

VERIFICATIONS:
   - Super admin user exists in users table
   - Has 'super_admin' role assigned
   - Has all system permissions

ACCESS:
   - Username: Check SUPER_ADMIN_USERNAME env var
   - Email: Check SUPER_ADMIN_EMAIL env var
   - Password: Check SUPER_ADMIN_PASSWORD env var

IMPORTANT:
   - Change password after first login
   - Use only for system administration
   - Do not share credentials

NEXT STEPS:
   1. Test login with credentials
   2. Verify access to all functionalities
   3. Change password for security
   4. Configure two-factor authentication (recommended)
*/
