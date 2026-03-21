# Offline Hardening Checklist

This checklist tracks what is needed for the app to behave as an offline-first mobile app.

## Core Sync

- [x] Queue non-GET writes when the device is offline
- [x] Replay queued writes when network/app focus returns
- [x] Avoid double-encoding queued JSON bodies
- [x] Show queued item count in the UI
- [x] Show failed sync reasons in the UI
- [x] Provide a Notifications inbox for manual retry
- [x] Sync offline group formation and beneficiary assignment as one backend transaction
- [x] Promote temporary local group IDs to real server group IDs after sync
- [x] Normalize beneficiary `dob` values to `YYYY-MM-DD` during offline replay

## Live UI Refresh

- [x] Broadcast a shared sync update event after queue changes
- [x] Refresh dashboard metrics after sync activity
- [x] Refresh notifications after sync activity
- [x] Refresh groups list after sync activity
- [x] Refresh group beneficiaries after sync activity
- [x] Refresh formation beneficiary allocation screen after sync activity
- [x] Refresh meetings/attendance screens after sync activity
- [x] Refresh savings screens after sync activity
- [x] Refresh training screens after sync activity
- [x] Refresh group/member IGA screens after sync activity
- [x] Re-read selected group context when a temp group ID is replaced by a real server ID

## Local Read Resilience

- [x] Use cached GET responses when offline
- [x] Merge offline beneficiary allocations into local beneficiary views
- [ ] Add local/offline fallback reads for meetings
- [ ] Add local/offline fallback reads for trainings
- [ ] Add local/offline fallback reads for savings
- [ ] Add local/offline fallback reads for group IGAs
- [ ] Add local/offline fallback reads for member IGAs

## Write Resilience

- [ ] Add optimistic UI updates for queued non-group operations
- [ ] Persist enough metadata to show exact record names for all queued request types
- [ ] Add conflict handling/idempotency for replayed non-group writes
- [ ] Surface per-item retry/backoff state for queued operations

## Device and Lifecycle

- [ ] Verify Android background/foreground sync behavior on real devices
- [ ] Verify app cold-start replay with existing queued items
- [ ] Verify behavior across logout/login with pending queue items
- [ ] Add a user-facing warning that uninstall clears unsynced local data

## Verification Matrix

- [ ] Offline login with previously saved credentials
- [ ] Offline group formation, then auto-sync on reconnect
- [ ] Offline beneficiary allocation, then auto-sync on reconnect
- [ ] Offline meeting creation and attendance replay
- [ ] Offline training creation and participant replay
- [ ] Offline group savings and member savings replay
- [ ] Offline group IGA and member IGA replay
- [ ] Mixed queue with both pending requests and offline groups
- [ ] Temp group selected while sync promotes to a real group ID
