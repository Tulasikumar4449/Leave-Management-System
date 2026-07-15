CREATE DATABASE IF NOT EXISTS leave_management;

USE leave_management;


-- =========================
-- USERS TABLE
-- =========================

CREATE TABLE IF NOT EXISTS users (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    role ENUM('employee','admin') DEFAULT 'employee',
    department VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);


-- =========================
-- LEAVE BALANCES TABLE
-- =========================

CREATE TABLE IF NOT EXISTS leave_balances (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    sick_leave INT DEFAULT 12,
    casual_leave INT DEFAULT 12,
    privileged_leave INT DEFAULT 15,
    optional_leave INT DEFAULT 5,
    PRIMARY KEY (id),

    CONSTRAINT fk_leave_balance_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);


-- =========================
-- LEAVE REQUESTS TABLE
-- =========================

CREATE TABLE IF NOT EXISTS leave_requests (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,

    leave_type ENUM(
        'Sick',
        'Casual',
        'Privileged',
        'Optional'
    ) DEFAULT NULL,

    from_date DATE NOT NULL,
    to_date DATE NOT NULL,

    days INT NOT NULL,

    reason TEXT NOT NULL,

    status ENUM(
        'PENDING',
        'APPROVED',
        'REJECTED'
    ) DEFAULT 'PENDING',

    admin_notes TEXT DEFAULT NULL,

    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_leave_request_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);


-- =========================
-- HOLIDAYS TABLE
-- =========================

CREATE TABLE IF NOT EXISTS holidays (

    id INT NOT NULL AUTO_INCREMENT,

    holiday_name VARCHAR(100) NOT NULL,

    holiday_date DATE NOT NULL,

    description VARCHAR(255) DEFAULT NULL,

    PRIMARY KEY (id)

);


-- =========================
-- NOTIFICATIONS TABLE
-- =========================

CREATE TABLE IF NOT EXISTS notifications (

    id INT NOT NULL AUTO_INCREMENT,

    user_id INT NOT NULL,

    message TEXT NOT NULL,

    is_read TINYINT(1) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_notification_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE

);