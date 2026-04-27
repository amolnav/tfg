CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
ADD CONSTRAINT booking_no_table_overlap
EXCLUDE USING GIST (
  "tableId" WITH =,
  tsrange("date", "date" + make_interval(mins => "duration"), '[)') WITH &&
)
WHERE (
  "tableId" IS NOT NULL
  AND "status" <> 'CANCELLED'
  AND "status" <> 'NO_SHOW'
);
