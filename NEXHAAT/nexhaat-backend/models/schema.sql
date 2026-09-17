-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    role TEXT CHECK(role IN ('FARMER', 'FPO', 'BUYER', 'TRANSPORTER')) NOT NULL,
    district TEXT NOT NULL,
    state TEXT DEFAULT 'Maharashtra',
    is_verified INTEGER DEFAULT 1,
    trust_score REAL DEFAULT 100.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Farmer Individual Lots Table
CREATE TABLE IF NOT EXISTS farmer_lots (
    id TEXT PRIMARY KEY,
    farmer_id TEXT REFERENCES users(id),
    commodity TEXT NOT NULL,
    variety TEXT NOT NULL,
    quantity_quintals REAL NOT NULL,
    quality_grade TEXT CHECK(quality_grade IN ('Grade-A', 'Grade-B', 'Grade-C')),
    harvest_date DATE,
    urgency_days INTEGER DEFAULT 3,
    expected_price REAL,
    photo_url TEXT,
    status TEXT CHECK(status IN ('DRAFT', 'LISTED', 'AGGREGATED', 'SOLD')) DEFAULT 'LISTED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. FPO Aggregated Bulk Lots Table
CREATE TABLE IF NOT EXISTS fpo_bulk_lots (
    id TEXT PRIMARY KEY,
    fpo_id TEXT REFERENCES users(id),
    commodity TEXT NOT NULL,
    variety TEXT NOT NULL,
    total_quantity REAL NOT NULL,
    quality_grade TEXT NOT NULL,
    reserve_price REAL NOT NULL,
    pickup_location TEXT NOT NULL,
    qr_code_data TEXT,
    status TEXT CHECK(status IN ('COLLECTING', 'OPEN_FOR_BIDS', 'MATCHED', 'IN_TRANSIT', 'COMPLETED')) DEFAULT 'COLLECTING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Lot Aggregation Mapping Table
CREATE TABLE IF NOT EXISTS fpo_lot_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bulk_lot_id TEXT REFERENCES fpo_bulk_lots(id),
    farmer_lot_id TEXT REFERENCES farmer_lots(id)
);

-- 5. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    bulk_lot_id TEXT REFERENCES fpo_bulk_lots(id),
    buyer_id TEXT REFERENCES users(id),
    transporter_id TEXT REFERENCES users(id),
    gross_amount REAL NOT NULL,
    logistics_cost REAL NOT NULL,
    handling_cost REAL NOT NULL,
    net_fpo_amount REAL NOT NULL,
    payment_status TEXT CHECK(payment_status IN ('PENDING', 'INITIATED', 'ESCROW_HELD', 'PAID', 'OVERDUE')) DEFAULT 'PENDING',
    delivery_status TEXT CHECK(delivery_status IN ('SCHEDULED', 'PICKED_UP', 'DELIVERED')) DEFAULT 'SCHEDULED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. OTP Storage Table
CREATE TABLE IF NOT EXISTS otp_store (
    phone TEXT PRIMARY KEY,
    otp TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Grievances & Disputes Table
CREATE TABLE IF NOT EXISTS grievances (
    id TEXT PRIMARY KEY,
    transaction_id TEXT REFERENCES transactions(id),
    raised_by TEXT REFERENCES users(id),
    issue_type TEXT CHECK(issue_type IN ('QUALITY_DISPUTE', 'PAYMENT_DELAY', 'WEIGHT_DISCREPANCY', 'LOGISTICS_DELAY')),
    description TEXT,
    evidence_url TEXT,
    status TEXT CHECK(status IN ('OPEN', 'INVESTIGATING', 'RESOLVED')) DEFAULT 'OPEN',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
