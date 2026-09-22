# Provider Routing Rollout Plan

Audit date: 2026-09-12

## Principles

- Automatic failover starts disabled and is enabled per service/provider scope only after evidence gates pass.
- Schema, observability, route selection, circuit decisions, and failover activation ship separately.
- Existing single-provider routing remains the production authority until shadow comparisons are clean.
- Ambiguous outcomes never trigger automatic failover.
- App and reseller/API channels use one orchestrator.
- Every phase has a feature flag / application rollback path; no emergency rollback depends on dropping data.

## Phase 0 — audit (this deliverable)

Outputs are the seven documents in this directory. No application behavior, production credential, or database state is changed.

Exit criteria:

- Current lifecycle and gateway convergence documented.
- Capability unknowns are explicit rather than assumed.
- Schema drift and automatic-failover blockers are recorded.

## Phase 1 — durable foundations, current routing unchanged

### Scope

1. Add versioned, additive schema for canonical products/mappings, draft routing rules, durable purchase intents, provider attempts, circuit state, and callback dedupe.
2. Repair checked-in schema drift (`auth_url`, transaction `cost_price`, pricing unique identity) only after read-only preflight and reviewed collision resolution.
3. Introduce typed transport/outcome contracts and provider capability definitions with fixture tests.
4. Create a routing resolver that can evaluate draft/published seed rules in **shadow mode only**.
5. Seed each service's draft default with only its currently active provider; do not add automatic fallbacks.
6. Add feature flags defaulting to current selection and failover off.

Current `find_by_service_type()` remains authoritative in Phase 1. Shadow evaluation records whether the new resolver would select the same first provider but never changes the provider call.

### Exact files recommended for Phase 1

New backend files:

- `backend/database/2026_09_XX_provider_routing_phase1.sql` — versioned idempotent upgrade, guarded by preflight/collision checks.
- `backend/database/2026_09_XX_provider_routing_phase1_preflight.sql` — read-only diagnostics.
- `backend/application/models/Routing_rule_model.php`
- `backend/application/models/Canonical_product_model.php`
- `backend/application/models/Provider_product_mapping_model.php`
- `backend/application/models/Purchase_intent_model.php`
- `backend/application/models/Provider_attempt_model.php`
- `backend/application/models/Provider_circuit_model.php`
- `backend/application/models/Provider_callback_event_model.php`
- `backend/application/libraries/Vtu_outcome.php` — constants/value validation for outcome and send-state taxonomy.
- `backend/application/libraries/Provider_capability_registry.php` — server-side provider/service capabilities.
- `backend/application/libraries/Provider_route_resolver.php` — deterministic precedence and eligibility, initially shadow-only.
- `backend/application/libraries/Purchase_reference.php` — one public/attempt reference policy.
- `backend/application/libraries/providers/Provider_adapter_contract.php` — documented adapter result contract (use an interface only if compatible with deployed PHP).
- `backend/application/controllers/api/Admin_Routing.php` — draft/read/validate endpoints only in Phase 1; no publish-to-live dispatch unless separately approved.
- `backend/application/controllers/cli/Provider_routing_reconcile.php` — bounded, lease-protected skeleton/diagnostics; no blind retries.
- `backend/application/tests/` fixtures/tests for precedence, mappings, outcome parsing, references, idempotency, circuit transitions, and schema preflight. Use the repository's chosen test layout when established.

Existing backend files to modify:

- `backend/database/schema.sql` — canonical fresh-install definitions and corrected comments; remove upgrade-runner ambiguity.
- `backend/application/config/api.php` — flags (`provider_routing_shadow`, `provider_routing_enabled`, `provider_failover_enabled`) and centralized time budgets, all safe/off by default.
- `backend/application/config/routes.php` — authenticated admin read/draft/validate routes and optional CLI route policy.
- `backend/application/libraries/Vtu_http.php` — preserve HTTP status and typed transport evidence, redact logs, distinguish definitely-not-sent where cURL can prove it from possibly-sent. Do not reclassify current production flow until orchestrator cutover.
- `backend/application/libraries/providers/Ade_provider.php`
- `backend/application/libraries/providers/Msorg_provider.php`
- `backend/application/libraries/providers/Smeplug_provider.php` — add contract-compatible parser methods/fixtures alongside current methods; do not enable new retry behavior.
- `backend/application/models/Provider_config_model.php` — stable ID reads and config validation; retain exclusive activation for current routing during Phase 1.
- `backend/application/models/Pricing_model.php` — reconcile identity/index semantics and canonical migration reads without changing public catalog selection.
- `backend/application/models/Transaction_model.php` — allow a supplied durable reference/idempotent linkage in the future path while preserving current callers.
- `backend/application/models/Profile_model.php` — add idempotent wallet-operation API or ledger integration, preserving current `adjust_wallet()` callers.
- `backend/application/controllers/api/Admin_Providers.php` — serve capabilities/config readiness and keep secrets write-only.
- `backend/application/controllers/api/Admin_Pricing.php` — align import identity and mapping validation.

New frontend files:

- `frontend/src/components/admin/AdminProviderRouting.tsx` — Phase 1 draft/shadow status, default-rule/mapping validation; no failover activation control.
- `frontend/src/lib/providerRoutingTypes.ts`

Existing frontend files to modify:

- `frontend/src/pages/AdminDashboard.tsx`
- `frontend/src/components/admin/AdminSidebar.tsx`
- `frontend/src/config/adminPermissions.ts` — add one routing section/permission.
- `frontend/src/App.tsx` only if the admin section becomes a distinct route rather than the existing section parameter.
- `frontend/src/components/admin/AdminApiSettings.tsx` — consume server capabilities and link to routing; remove inaccurate capability claims.
- `frontend/src/components/admin/AdminPricing.tsx` — link pricing rows to canonical mappings and remove/disable duplicated “Live API routing” once the dedicated screen exists.
- `frontend/src/lib/apiClient.ts` only if typed API helpers or idempotency-header support are added.

`backend/application/libraries/Vtu_service.php`, `Purchase.php`, `Gateway.php`, and `ResultChecker.php` should be inspected by Phase 1 tests but should not switch routing behavior in this phase. If shadow observation must be invoked there, keep it non-blocking, behind an off-by-default flag, and incapable of altering the selected provider or purchase result.

### Phase 1 exit criteria

- Migration preflight passes on a staging copy of the production database engine/version.
- No unresolved pricing identity collisions or missing schema columns.
- Every currently sold data plan is assigned a canonical product or explicitly excluded.
- Default rules exist in draft and shadow selection equals current provider selection for 100% of sampled eligible requests.
- Outcome fixtures cover every known status/error shape; unknowns normalize ambiguous.
- No secret/PIN/token/full provider body appears in application logs.
- No runtime failover occurs.

## Phase 2 — durable single-provider orchestration

Replace the internals of `Vtu_service` with the durable intent/attempt lifecycle, still using exactly one provider selected by current routing. Delegate `ResultChecker.php` to it. Make app, generic gateway, and dedicated gateway return the same public reference. Add client idempotency support and reconciliation/manual review.

Files centered in this phase:

- `backend/application/libraries/Vtu_service.php`
- `backend/application/controllers/api/Purchase.php`
- `backend/application/controllers/api/Gateway.php`
- `backend/application/controllers/api/ResultChecker.php`
- `backend/application/models/Transaction_model.php`
- `backend/application/models/Profile_model.php`
- All provider adapters and reconciliation controller/job
- Purchase pages and reseller docs for idempotency/reference response changes

Exit criteria include replay, crash-after-send, database reconnect, timeout, callback duplicate, and manual-resolution tests. No automatic second provider yet.

## Phase 3 — hierarchical resolver live, single entry only

Publish mandatory service-default rules and optional overrides. Route new intents through the resolver, but enforce one enabled entry or `max_attempts=1`. Compare selection and commercial metrics to shadow results.

Canary order: internal/test accounts -> small app percentage -> app service-wide -> reseller test keys -> reseller percentage -> reseller service-wide. Keep a kill switch back to the legacy active provider.

## Phase 4 — circuit observation and controlled skipping

Populate circuit metrics from typed outcomes. Initially show recommended state without skipping. Then enable OPEN-provider skipping only when another provider is not called for ambiguous/pending attempts and routing/mapping gates hold. Validate one half-open probe under concurrent load.

## Phase 5 — automatic failover by provider/service

Enable one provider/service pair at a time, starting with a service that has:

- Verified provider idempotency and status lookup.
- Complete canonical mappings.
- High-quality definitive rejection fixtures.
- Low fulfilment ambiguity in sandbox/canary.

Set conservative `max_attempts=2`, failure threshold/window/cooldown, and total time budget. Data comes only after mapping completeness. Providers without lookup remain ineligible for automatic failover after a possible send.

## Phase 6 — broader overrides and optimization

After stable service defaults, enable network/biller overrides, then category overrides, then most-specific network+category rules. Introduce commercial constraints, scheduled catalogue freshness checks, and more providers only through the capability/mapping gates.

## Monitoring and stop conditions

Monitor per provider/service/channel:

- Attempts, success, pending, definitive failure, ambiguity, and reconciliation age.
- Failover count and downstream success.
- Duplicate client request rate and idempotent replay rate.
- Debit/refund mismatches.
- Circuit transitions/probe leases.
- Route-resolution errors and missing/stale mappings.
- Provider latency and PHP/proxy time-budget exhaustion.

Immediately disable automatic failover for the affected scope if any of these occur:

- Confirmed or suspected double fulfilment.
- An ambiguous attempt followed by another provider attempt.
- Duplicate debit/refund or missing durable intent.
- Provider status cannot be reconciled within the agreed SLA.
- Mapping mismatch/wrong bundle delivery.
- Error/ambiguity rate exceeds the agreed canary threshold.
- Shared-host execution or database capacity approaches safe limits.

The rollback action is a feature-flag/route publication rollback for new intents. Existing pending/ambiguous intents remain on their recorded route snapshots and must be reconciled; they must not be replayed through the legacy path.

## Provider evidence checklist before activation

For ADE, MSORG, and SMEPLUG separately and per service:

- Documentation version and owner recorded.
- Sandbox credentials and non-production fixtures available.
- Duplicate-reference behavior verified.
- Status lookup implemented and tested, or automatic ambiguity recovery explicitly disabled.
- Low balance/auth/product error codes verified definitive.
- Timeout-after-send test produces no blind retry.
- Provider code/network/biller maps reviewed by two people.
- Operational contact, outage procedure, and reconciliation SLA documented.
