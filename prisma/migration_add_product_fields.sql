-- Migration: Tambah kolom brand, size, deal_method ke tabel products
-- Jalankan query ini di database MySQL kamu (jubagi_db)

ALTER TABLE `products`
  ADD COLUMN `size` VARCHAR(100) NULL AFTER `condition`,
  ADD COLUMN `brand` VARCHAR(100) NULL AFTER `size`,
  ADD COLUMN `deal_method` ENUM('pickup', 'delivery', 'both') NULL AFTER `brand`;
