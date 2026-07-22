-- =============================
-- USERS
-- =============================
CREATE TABLE users (
id INT AUTO_INCREMENT PRIMARY KEY,
email VARCHAR(255) UNIQUE NOT NULL,
password TEXT NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================
-- PROFILES
-- =============================
CREATE TABLE profiles (
id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT,
name VARCHAR(100),
phone VARCHAR(20),
address TEXT,
avatar TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================
-- CATEGORIES
-- =============================
CREATE TABLE categories (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(100),
parent_id INT,
FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- =============================
-- PRODUCTS
-- =============================
CREATE TABLE products (
id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT,
category_id INT,
title VARCHAR(255),
description TEXT,
price BIGINT,
type ENUM('jual','hibah'),
condition VARCHAR(100),
location VARCHAR(255),
status VARCHAR(20) DEFAULT 'available',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(id),
FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- =============================
-- PRODUCT IMAGES
-- =============================
CREATE TABLE product_images (
id INT AUTO_INCREMENT PRIMARY KEY,
product_id INT,
image_url TEXT,
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- =============================
-- PRODUCT LIKES
-- =============================
CREATE TABLE product_likes (
id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT,
product_id INT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
UNIQUE KEY unique_like (user_id, product_id),
FOREIGN KEY (user_id) REFERENCES users(id),
FOREIGN KEY (product_id) REFERENCES products(id)
);

-- =============================
-- CHAT ROOMS (SINKRON KE SUPABASE)
-- =============================
CREATE TABLE chat_rooms (
id INT AUTO_INCREMENT PRIMARY KEY,
product_id INT,
buyer_id INT,
seller_id INT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================
-- PRICE OFFERS
-- =============================
CREATE TABLE price_offers (
id INT AUTO_INCREMENT PRIMARY KEY,
product_id INT,
buyer_id INT,
offer_price BIGINT,
status VARCHAR(20) DEFAULT 'pending',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================
-- TRANSACTIONS
-- =============================
CREATE TABLE transactions (
id INT AUTO_INCREMENT PRIMARY KEY,
product_id INT,
buyer_id INT,
seller_id INT,
total_price BIGINT,
status VARCHAR(20) DEFAULT 'pending',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================
-- PAYMENTS
-- =============================
CREATE TABLE payments (
id INT AUTO_INCREMENT PRIMARY KEY,
transaction_id INT,
payment_method VARCHAR(50),
payment_status VARCHAR(50),
midtrans_order_id VARCHAR(255),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================
-- HIBAH REQUESTS
-- =============================
CREATE TABLE hibah_requests (
id INT AUTO_INCREMENT PRIMARY KEY,
product_id INT,
requester_id INT,
message TEXT,
status VARCHAR(20) DEFAULT 'pending',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================
-- REVIEWS
-- =============================
CREATE TABLE reviews (
id INT AUTO_INCREMENT PRIMARY KEY,
transaction_id INT,
reviewer_id INT,
rating INT CHECK (rating BETWEEN 1 AND 5),
comment TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
