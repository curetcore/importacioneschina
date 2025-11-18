-- Rename comisionBancoRD to comisionBancoUSD
-- Date: 2025-11-18
-- Objective: Change commission field from RD$ to USD for international payments

-- Rename the column
ALTER TABLE "pagos_china"
RENAME COLUMN "comision_banco_rd" TO "comision_banco_usd";

-- Note: The values will remain the same, but they should now be interpreted as USD
-- Users should update existing records if they were entered as RD$ amounts
