# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.0] - 2026-08-11

### Added

- Per-property accent colour, picked from a closed palette in the property modal. The whole UI is tinted with the active
  property's accent and follows every switch — **including the sidebar gradient**, its active-item marker, the property
  switcher menu and the weather widget. The property switcher and the property cards carry a matching dot.
- Two derived tokens, `--accent-ink` (dark surfaces) and `--accent-soft` (elements sitting on top of them), so the
  sidebar can be tinted without losing contrast.
- The weather widget's location segment and today's cell, and the « En cours » work pill, follow the accent too.
  The other work statuses and the priorities keep their semantic colour code and now read it from the shared
  `--ok` / `--worn` / `--replace` tokens instead of raw hexadecimals.

### Changed

- The accent is no longer a local user preference: it is read from `Property.accentHex` and dropped from the `tweaks`
  store, which now only keeps density, calendar view and grain.
- Page title is now just « Les Marmottes » — it is the name of the service, not of the Villard-de-Lans flat.

## [1.3.0] - 2026-06-22

### Added

- Weather forecast widget to planning
- Mini weather info when planning a reservation

## [1.2.0] - 2026-06-22

### Added

- Alphabetical order for items in inventory and shopping list

## [1.1.3] - 2026-06-11

### Fixed

- Add links to the app when installed

## [1.1.2] - 2026-06-11

### Fixed

- Add github action to deploy

## [1.1.1] - 2026-06-10

### Fixed

- renamed build:deploy command to deploy in package.json
- authenticate via SSH key and upload with rsync
- extract duplicated formatError into a single util

## [1.1.0] - 2026-06-09

### Changed

- Added work management page
- Added doc sync command
- Added 404 page

## [1.0.0] - 2026-06-08

### Added

- Initial release.
  [unreleased]: https://github.com/marmottes-industries/villard-front/compare/v1.4.0...main
  [1.4.0]: https://github.com/marmottes-industries/villard-front/compare/v1.4.0...v1.3.0
  [1.3.0]: https://github.com/marmottes-industries/villard-front/compare/v1.3.0...v1.2.0
  [1.2.0]: https://github.com/marmottes-industries/villard-front/compare/v1.2.0...v1.1.3
  [1.1.3]: https://github.com/marmottes-industries/villard-front/compare/v1.1.3...v1.1.2
  [1.1.2]: https://github.com/marmottes-industries/villard-front/compare/v1.1.2...1.1.1
  [1.1.1]: https://github.com/marmottes-industries/villard-front/compare/1.1.1...1.1.0
  [1.1.0]: https://github.com/marmottes-industries/villard-front/compare/1.1.0...1.0.0
  [1.0.0]: https://github.com/marmottes-industries/villard-front/compare/main...1.0.0
