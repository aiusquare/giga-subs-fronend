# Prompt 05 — Make CSV Import Compatible with Browser and Excel Exports

Diagnose and fix a bulk-pricing CSV that visibly contains the correct headers but is reported as missing `service_type`. Inspect the first bytes and account for a UTF-8 BOM appearing before the first quoted header.

Update the backend CSV reader so it:

- Reads and removes the UTF-8 BOM from the stream before calling `fgetcsv`; removing it from the already-parsed field is too late because the opening quote is no longer recognized as an enclosure.
- Rewinds when no BOM exists.
- Rejects UTF-16 files with a clear instruction to save as UTF-8.
- Continues accepting normal UTF-8 CSV files.
- Uses explicit delimiter, enclosure and escape arguments.

Also ensure an exported current pricelist can be re-imported when a legacy existing row has no plan code. Match that legacy row by normalized service, provider and exact plan name, warn about the legacy match, and continue requiring a plan code for genuinely new rows. Preserve original invalid values when downloading rejected rows.

Prove the supplied CSV header parses into all required columns and run PHP syntax plus frontend lint checks.
