# Changelog

All notable changes to Origin OS will be documented here.

---

## [0.5.0] - 2026-03-24

### Added

- Activity modal for artwork preview in Activity Timeline
- Metadata-ready modal layout (foundation for artwork inspector panel)

### Fixed

- Authenticated image previews not rendering due to missing Authorization headers
- Replaced `<img src>` usage with fetch → blob → object URL pattern

### Improved

- Unified modal behavior between Dashboard and Activity views
- Activity timeline now supports image preview instead of redirect-only behavior
- Added object URL cleanup to prevent memory leaks

### Notes

This change establishes a consistent, secure pattern for rendering protected media across the app and enables future features such as gated/unlockable content.

## [0.4.0] - 2026-03-22

### Changed

- Renamed `collection` field to `collectionName` in Artwork schema to avoid conflict with Mongoose reserved keys

### Migration

- Existing documents updated:
  - `collection` → `collectionName`
  - Removed legacy `collection` field

### Notes

- Prevents potential schema ambiguity and future bugs
- Reinforces consistent data modeling across API and frontend

---

### Engineering Note

Fixes like this are best done early while they are low-cost.
Left unaddressed, small schema inconsistencies can propagate across services and become significantly harder to correct later.

## [0.3.0] - 2026-03-08

### Added

- Async image generation API
- MongoDB artwork storage

### Changed

- Improved dashboard image loading

### Fixed

- Image retrieval authentication bug

---

## [0.2.0] - 2026-02-20

### Added

- JWT authentication
- Artwork creation API

---

## [0.1.0] - 2026-02-01

### Initial Release

- Basic Node/Express backend
- MongoDB connection
