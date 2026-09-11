# Prompt 09 — Fix Revenue and Profit Accounting

Investigate why Revenue Today and Profit Today can be identical even though Service Pricing contains different cost and selling prices. Do not alter the pricing values; fix propagation of the selected pricing row into transaction history.

## Root behavior to correct

Identity verification precharge selects the correct price and debits `selling_price`, but its history writer currently records transaction `cost_price` as zero and uses a generic display title that does not match the pricing plan name. Therefore dashboard fallback subtracts zero.

## Required fix

- Make verification precharge return the selected pricing object.
- Pass it into every success/failure history write for BVN, NIN and NIN slip flows.
- Store the selected configured cost in `transactions.cost_price`.
- Add pricing ID, plan code, API provider and unit cost to transaction metadata.
- For result-checker quantity purchases, store total configured cost (`unit cost × quantity`) and preserve pricing metadata.
- For variable airtime/electricity flows, store provider-reported cost and provider metadata when available.
- Keep `cost_price` semantics consistent as total upstream cost for the transaction.
- Update Dashboard, Stats and Analytics fallbacks for older zero-cost rows: prefer active-API exact plan matches, then a safe active-service pricing fallback.
- Continue excluding funding, wallet and admin credit/debit types from service revenue/profit.

Expected example: one ₦200 BVN sale at ₦90 cost plus one ₦200 NIN sale at ₦110 cost produces ₦400 revenue, ₦200 cost and ₦200 profit.

Run PHP syntax checks for every changed backend file and the existing test suite.
