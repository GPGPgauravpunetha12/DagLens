-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create blocks table
CREATE TABLE IF NOT EXISTS blocks (
    id VARCHAR(255) PRIMARY KEY,
    hash VARCHAR(255) UNIQUE NOT NULL,
    parent_hash VARCHAR(255),
    timestamp TIMESTAMPTZ NOT NULL,
    confirmations INTEGER DEFAULT 0,
    is_tip BOOLEAN DEFAULT false,
    weight INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    hash VARCHAR(255) PRIMARY KEY,
    from_address VARCHAR(255) NOT NULL,
    to_address VARCHAR(255) NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    block_hash VARCHAR(255) REFERENCES blocks(hash),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create metrics table (TimescaleDB hypertable)
CREATE TABLE IF NOT EXISTS metrics (
    timestamp TIMESTAMPTZ NOT NULL,
    tps DECIMAL(10, 2),
    confirmation_latency DECIMAL(10, 2),
    tip_pool_size INTEGER,
    orphan_rate DECIMAL(5, 2),
    total_blocks INTEGER,
    total_transactions INTEGER
);

-- Convert metrics table to TimescaleDB hypertable
SELECT create_hypertable('metrics', 'timestamp', if_not_exists => TRUE);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blocks_timestamp ON blocks(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_blocks_hash ON blocks(hash);
CREATE INDEX IF NOT EXISTS idx_blocks_parent_hash ON blocks(parent_hash);
CREATE INDEX IF NOT EXISTS idx_blocks_is_tip ON blocks(is_tip);

CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(hash);
CREATE INDEX IF NOT EXISTS idx_transactions_from_address ON transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_transactions_to_address ON transactions(to_address);
CREATE INDEX IF NOT EXISTS idx_transactions_block_hash ON transactions(block_hash);

-- Create materialized view for DAG relationships
CREATE MATERIALIZED VIEW IF NOT EXISTS dag_relationships AS
SELECT 
    b1.id as block_id,
    b1.hash as block_hash,
    b1.parent_hash,
    b2.hash as parent_block_hash,
    b1.timestamp as block_timestamp,
    b2.timestamp as parent_timestamp,
    b1.confirmations,
    b1.is_tip,
    b1.weight
FROM blocks b1
LEFT JOIN blocks b2 ON b1.parent_hash = b2.hash
ORDER BY b1.timestamp DESC;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_dag_relationships_block_id ON dag_relationships(block_id);
CREATE INDEX IF NOT EXISTS idx_dag_relationships_parent_hash ON dag_relationships(parent_hash);

-- Insert sample data for testing
INSERT INTO blocks (id, hash, parent_hash, timestamp, confirmations, is_tip, weight) VALUES
('genesis', '0000000000000000000000000000000000000000000000000000000000000000', NULL, NOW() - INTERVAL '1 hour', 100, false, 1),
('block1', '1111111111111111111111111111111111111111111111111111111111111111', '0000000000000000000000000000000000000000000000000000000000000000', NOW() - INTERVAL '50 minutes', 50, false, 1),
('block2', '2222222222222222222222222222222222222222222222222222222222222222', '1111111111111111111111111111111111111111111111111111111111111111', NOW() - INTERVAL '40 minutes', 40, false, 1),
('block3', '3333333333333333333333333333333333333333333333333333333333333333', '1111111111111111111111111111111111111111111111111111111111111111', NOW() - INTERVAL '35 minutes', 35, false, 1),
('block4', '4444444444444444444444444444444444444444444444444444444444444444', '2222222222222222222222222222222222222222222222222222222222222222', NOW() - INTERVAL '30 minutes', 30, false, 1),
('block5', '5555555555555555555555555555555555555555555555555555555555555555', '3333333333333333333333333333333333333333333333333333333333333333', NOW() - INTERVAL '25 minutes', 25, false, 1),
('block6', '6666666666666666666666666666666666666666666666666666666666666666', '4444444444444444444444444444444444444444444444444444444444444444', NOW() - INTERVAL '20 minutes', 20, true, 1),
('block7', '7777777777777777777777777777777777777777777777777777777777777777', '5555555555555555555555555555555555555555555555555555555555555555', NOW() - INTERVAL '15 minutes', 15, true, 1),
('block8', '8888888888888888888888888888888888888888888888888888888888888888', '6666666666666666666666666666666666666666666666666666666666666666', NOW() - INTERVAL '10 minutes', 10, true, 1),
('block9', '9999999999999999999999999999999999999999999999999999999999999999', '7777777777777777777777777777777777777777777777777777777777777777', NOW() - INTERVAL '5 minutes', 5, true, 1),
('block10', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', '8888888888888888888888888888888888888888888888888888888888888888', NOW() - INTERVAL '2 minutes', 2, true, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO transactions (hash, from_address, to_address, amount, timestamp, block_hash, status) VALUES
('tx1', 'address1', 'address2', 100.0, NOW() - INTERVAL '45 minutes', '1111111111111111111111111111111111111111111111111111111111111111', 'confirmed'),
('tx2', 'address2', 'address3', 50.0, NOW() - INTERVAL '40 minutes', '2222222222222222222222222222222222222222222222222222222222222222', 'confirmed'),
('tx3', 'address3', 'address4', 25.0, NOW() - INTERVAL '35 minutes', '3333333333333333333333333333333333333333333333333333333333333333', 'confirmed'),
('tx4', 'address4', 'address5', 75.0, NOW() - INTERVAL '30 minutes', '4444444444444444444444444444444444444444444444444444444444444444', 'confirmed'),
('tx5', 'address5', 'address6', 200.0, NOW() - INTERVAL '25 minutes', '5555555555555555555555555555555555555555555555555555555555555555', 'confirmed'),
('tx6', 'address6', 'address7', 150.0, NOW() - INTERVAL '20 minutes', '6666666666666666666666666666666666666666666666666666666666666666', 'confirmed'),
('tx7', 'address7', 'address8', 300.0, NOW() - INTERVAL '15 minutes', '7777777777777777777777777777777777777777777777777777777777777777', 'confirmed'),
('tx8', 'address8', 'address9', 125.0, NOW() - INTERVAL '10 minutes', '8888888888888888888888888888888888888888888888888888888888888888', 'confirmed'),
('tx9', 'address9', 'address10', 80.0, NOW() - INTERVAL '5 minutes', '9999999999999999999999999999999999999999999999999999999999999999', 'confirmed'),
('tx10', 'address10', 'address1', 90.0, NOW() - INTERVAL '2 minutes', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'confirmed')
ON CONFLICT (hash) DO NOTHING;

-- Refresh materialized view
REFRESH MATERIALIZED VIEW dag_relationships; 