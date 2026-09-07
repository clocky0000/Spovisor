ALTER TABLE trip_history
    ADD COLUMN course_json TEXT,
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN expires_at TIMESTAMP;

UPDATE trip_history
SET status = 'COMPLETED'
WHERE rating IS NOT NULL;

CREATE INDEX idx_trip_history_user_status_expires
    ON trip_history (user_id, status, expires_at);
