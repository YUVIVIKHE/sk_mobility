-- ============================================================
-- SK Mobility: Add description column to expense_categories
-- Run this in phpMyAdmin → SQL tab
-- ============================================================

ALTER TABLE expense_categories
  ADD COLUMN IF NOT EXISTS description TEXT NULL AFTER name;

-- Verify
SELECT id, name, description FROM expense_categories ORDER BY name;
