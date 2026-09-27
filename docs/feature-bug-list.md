# Feature and Bug List

Track planned features, defects, and maintenance work here. Keep active work in the open tables. When an item is released, move it to the completed section and add the user-facing detail to [changelog.md](changelog.md) when appropriate.

## Statuses

| Status | Meaning |
| --- | --- |
| `Backlog` | Accepted but not yet scheduled. |
| `Ready` | Defined well enough to implement. |
| `In progress` | Actively being worked on. |
| `Blocked` | Cannot proceed; note the dependency in the item. |
| `Released` | Deployed or otherwise complete. |

## Features

| ID | Status | Priority | Summary | Acceptance criteria | Owner | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| F-001 | Backlog | Medium | Increase the Address column width in the address list. | Address values have more horizontal space than the current automatic table layout. | Unassigned | Requested 2026-09-01; implement later. |
| F-002 | Backlog | Medium | Add a New Address option to the Visitations page. | Users can start creating a new address from the Visitations page, and the new address is associated with the current masjid and selected unit. | Unassigned | Requested 2026-09-01; implement later. |
| F-004 | In progress | Medium | Add and edit students (name, goes to, year of birth) on a listing. | On Address Detail, users can add, edit and remove students with name (required), Goes to (Madrasa, High-School, College-University, Work) and YOB; changes persist via `PUT /api/addressList/:id/students`. | Unassigned | Requested 2026-09-26. Phase 2 (later): add students on the new-listing form (`AddAddress`) by reusing `StudentEditor`; the API already accepts `students` on create. |
| F-003 | Backlog | Medium | Add a Print feature. | Users can print the current page through a visible print action, with the page's primary content included in the print output. | Unassigned | Requested 2026-09-01; implement later. |

## Bugs

| ID | Status | Priority | Summary | Steps to reproduce | Expected behavior | Owner | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| B-001 | Backlog | Medium | _Add bug summary_ | _List the smallest reliable reproduction._ | _Describe the correct behavior._ | Unassigned | |

## Maintenance

| ID | Status | Priority | Summary | Definition of done | Owner | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| M-001 | Backlog | Low | _Add maintenance task_ | _State the verifiable outcome._ | Unassigned | |

## Completed

Move released items here in reverse chronological order. Preserve the ID and include the release date.

| ID | Type | Released | Summary | Verification |
| --- | --- | --- | --- | --- |
