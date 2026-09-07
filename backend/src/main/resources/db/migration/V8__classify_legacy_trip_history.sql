UPDATE trip_history
SET status = 'COMPLETED'
WHERE course_json IS NULL;
