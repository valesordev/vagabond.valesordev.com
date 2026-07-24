-- Trip planning dates (US-001)
ALTER TABLE trips
    ADD COLUMN start_date date,
    ADD COLUMN end_date date;
