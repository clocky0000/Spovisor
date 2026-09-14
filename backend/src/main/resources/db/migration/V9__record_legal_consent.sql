ALTER TABLE app_user
    ADD COLUMN terms_version VARCHAR(20),
    ADD COLUMN terms_agreed_at TIMESTAMP,
    ADD COLUMN privacy_version VARCHAR(20),
    ADD COLUMN privacy_agreed_at TIMESTAMP;

COMMENT ON COLUMN app_user.terms_version IS 'Accepted service terms version';
COMMENT ON COLUMN app_user.privacy_version IS 'Accepted privacy policy version';
