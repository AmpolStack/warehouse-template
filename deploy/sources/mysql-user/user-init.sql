CREATE DATABASE IF NOT EXISTS user_database;
USE user_database;

CREATE TABLE IF NOT EXISTS customer (
    tenant_id INT NOT NULL,
    customer_id BIGINT AUTO_INCREMENT,
    segment VARCHAR(50),
    city VARCHAR(100),
    customer_type VARCHAR(50),
    PRIMARY KEY (tenant_id, customer_id),
    KEY idx_customer_id (customer_id)
);

CREATE TABLE IF NOT EXISTS employee (
    tenant_id INT NOT NULL,
    employee_id BIGINT AUTO_INCREMENT,
    position VARCHAR(100),
    branch_id INT,
    PRIMARY KEY (tenant_id, employee_id),
    KEY idx_employee_id (employee_id)
);

CREATE TABLE IF NOT EXISTS branch (
    tenant_id INT NOT NULL,
    branch_id INT AUTO_INCREMENT,
    name VARCHAR(200),
    city VARCHAR(100),
    zone VARCHAR(100),
    PRIMARY KEY (tenant_id, branch_id),
    KEY idx_branch_id (branch_id)
);

CREATE TABLE IF NOT EXISTS payment_method (
    method_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(30) NOT NULL
);

INSERT IGNORE INTO payment_method (name, type) VALUES
('Efectivo', 'cash'),
('Tarjeta de Crédito', 'card'),
('Tarjeta de Débito', 'card'),
('Transferencia Bancaria', 'transfer'),
('Pago Móvil', 'digital');