-- ==============================================================================
-- MIGRATION: Remove Description Column from Products Table
-- ==============================================================================
-- Run this in your Supabase SQL Editor to remove the description column
-- which has been removed from the admin UI
--
-- Steps:
-- 1. Go to: https://app.supabase.com/project/YOUR-PROJECT-ID/sql/new
-- 2. Copy all the SQL code below
-- 3. Paste into the SQL editor
-- 4. Click "Run" button
-- ==============================================================================

-- Drop the description column from products table
ALTER TABLE products
DROP COLUMN IF EXISTS description;

-- ==============================================================================
-- VERIFICATION: Run this to confirm the column is removed
-- ==============================================================================
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'products' AND column_name = 'description';
-- (Should return no results if successfully dropped)
