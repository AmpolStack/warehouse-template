CREATE DATABASE IF NOT EXISTS product_database;
USE product_database;

CREATE TABLE IF NOT EXISTS product (
    tenant_id INT NOT NULL,
    product_id BIGINT AUTO_INCREMENT UNIQUE,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    base_price DECIMAL(12,2) NOT NULL,
    tax_percent DECIMAL(5,2) DEFAULT 0.0,
    PRIMARY KEY (tenant_id, product_id)
);

CREATE TABLE IF NOT EXISTS category (
    tenant_id INT NOT NULL,
    category_id INT AUTO_INCREMENT UNIQUE,
    name VARCHAR(100) NOT NULL,
    parent_category_id INT NULL,
    PRIMARY KEY (tenant_id, category_id)
);