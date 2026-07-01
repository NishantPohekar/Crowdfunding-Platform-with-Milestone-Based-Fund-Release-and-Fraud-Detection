ALTER TABLE campaigns
ADD COLUMN rejection_reason TEXT,
ADD COLUMN pause_reason TEXT;

ALTER TABLE users
ADD COLUMN deactivation_reason TEXT;
