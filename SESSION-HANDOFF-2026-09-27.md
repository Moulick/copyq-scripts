# CopyQ cleanup session handoff — 2026-09-27

This document captures the decisions, discoveries, completed work, and safety
constraints from the CopyQ cleanup session. It is intended to let a future
session continue without rediscovering how this CopyQ installation is laid out
or accidentally loading or printing the clipboard history.

## Goal and safety boundaries

- The original problem was a CopyQ backup of roughly 600 MB. The goal is to
  identify unusually large live CopyQ items, inspect them in the CopyQ UI, and
  manually delete items that are no longer useful.
- CopyQ backup directories can have different names and locations on each
  laptop. **Do not inspect, parse, search, or dump their contents**, regardless
  of where they are stored. They are backups of live CopyQ data sets.
- Do not dump the live clipboard history or print clipboard content. It is very
  large and may contain sensitive text, HTML, images, and arbitrary other MIME
  formats.
- Metadata-only checks are acceptable when narrowly scoped: tab names, item
  counts, MIME format names, row numbers, and byte totals.
- Scripts that must measure or move complete items should handle one item at a
  time, never print its payload, and release the item reference immediately.
- The user made a full backup manually. An attempted tab-clone script did not
  work and was removed. There is intentionally no clone script in this folder.
- Clipboard monitoring was manually disabled by the user during cleanup. Do
  not enable it automatically from outside a script. First check the current
  state because it may have changed since this note was written.

## CopyQ layout and terminology

- CopyQ executable on every laptop:
  `/Applications/CopyQ.app/Contents/MacOS/CopyQ`
- Main tab: `&clipboard`
- Image review tab: `&Images`
- Largest-item review tab: `&Biggest 50`
- CopyQ script rows are zero-based. A human-facing item number is normally
  `row + 1`.
- Deleting or moving an item shifts every later row. Any saved row or item
  number becomes stale after a deletion.
- What the UI calls item formats are MIME-keyed payloads such as `text/plain`,
  `text/html`, `image/png`, and CopyQ-specific `application/x-copyq-*` values.
  These are not all "tags". `application/x-copyq-tags` is the specific format
  CopyQ uses for tags.

## Historical live-data observations

These are snapshots from before or during cleanup, not guaranteed current
values:

- An early check showed about 89,380 items and roughly 630 MiB of model data.
- A later tag scan showed 87,313 items in `&clipboard`.
- Of those, 85,276 had a non-empty `application/x-copyq-tags` value.
- All 85,276 non-empty tag values began with a blank leading comma.
- Zero non-empty tag values had the desired no-leading-comma form at that time.
- The image items were moved to `&Images`, reviewed, and then deleted by the
  user. Treat the current tab state as live and recheck counts if needed.
- The user confirmed that the optimized tag repair works, but final post-repair
  counts were not captured in this session.

## Measuring item size correctly

The useful size for cleanup is the sum of the byte lengths of **all MIME
payloads in an item**, not merely `text/plain` and not the number of
characters. For example, an item can simultaneously contain plain text, HTML,
metadata, and custom formats.

Important consequences:

- The old experimental scripts that only call `read("text/plain", row)` cannot
  find image-only or rich-content items and are not reliable size tools.
- `getItem(row)` returns the complete MIME map for one item. Iterate every key
  and add each payload's byte length.
- CopyQ byte arrays normally provide `.size()`; `.length` is only a fallback.
- A sum of MIME payloads is not the same as backup or on-disk size. CopyQ
  metadata, database structure, indexes, compression, and storage overhead are
  outside that sum.
- Finding exact all-format sizes necessarily reads each item's payload once.
  The safe compromise used here is streaming one item at a time, retaining only
  row numbers and byte totals, omitting content from output, and dropping the
  payload reference after each row.

## Row-shift lesson

Rows are positional, so deleting while iterating from low to high corrupts the
meaning of later row numbers. For scripts that remove or move source items:

1. Scan first while the source is stable.
2. Disable monitoring if it was enabled.
3. Process/removal source rows from highest to lowest.
4. Insert and verify the destination item before removing the source item.
5. Restore monitoring only when the script itself disabled it.

Moving the largest entries to a dedicated tab is more practical than printing
row numbers: once they are in `&Biggest 50`, the user can review and manage
them directly without the original row numbers changing after every deletion.

## Current useful scripts

### `biggest-items.js`

Purpose: move the 50 largest complete items from `&clipboard` to
`&Biggest 50`.

- Measures each item as the sum of all MIME payload byte lengths.
- Keeps only the largest 50 measurements in memory during the scan.
- Moves complete item maps, preserving text, HTML, tags, timestamps, images,
  and any other formats.
- Processes source rows from bottom to top so removals are safe.
- Keeps the destination ordered largest-first.
- Refuses to start if `&Biggest 50` already contains items. Review and empty,
  delete, or rename that tab before starting another batch.
- If destination insertion succeeds but source removal fails, the final item
  may temporarily exist in both tabs; the script reports this condition.
- It pauses monitoring only if monitoring was enabled when it started, then
  restores that original state.

Run from the directory containing the scripts:

```sh
/Applications/CopyQ.app/Contents/MacOS/CopyQ source "$PWD/biggest-items.js"
```

### `move-images.js`

Purpose: move image items from `&clipboard` to `&Images`.

- Reads `read("?", row)` first, which returns format names rather than payloads.
- Treats `image/*` and `application/x-qt-image` as images.
- Calls `getItem(row)` only after the MIME names identify an image.
- Moves bottom-to-top and preserves the complete item.
- Verifies destination insertion before source removal.
- The image cleanup was completed in this session, so this script normally
  does not need to be run again unless new images have accumulated.

```sh
/Applications/CopyQ.app/Contents/MacOS/CopyQ source "$PWD/move-images.js"
```

### `biggest-images.js`

Purpose: read-only report of the 30 largest items in `&Images`.

- Sums every MIME payload for each image item.
- Prints metadata and byte counts, not image contents.
- This was useful before the images were deleted.

```sh
/Applications/CopyQ.app/Contents/MacOS/CopyQ source "$PWD/biggest-images.js"
```

### `fix-leading-comma-tags.js`

Purpose: one-time, restart-safe cleanup of the old Store Copy Time command.

- Removes one blank leading tag separator, including surrounding whitespace.
- Removes the redundant `application/x-copyq-user-copy-time` format.
- Does not load or modify text, HTML, images, or unrelated formats.
- Selects only affected MIME values, then applies partial item maps in batches
  of 500.
- Prints progress every 5,000 affected items.
- Is idempotent: already-fixed items are skipped and an interrupted run can be
  run again safely.
- Preserves the initial monitoring state. If monitoring was already disabled,
  it stays disabled when the script exits.

```sh
/Applications/CopyQ.app/Contents/MacOS/CopyQ source "$PWD/fix-leading-comma-tags.js"
```

## Store Copy Time bug and corrected command

The old automatic command was:

```js
copyq:
var time = dateString('yyyy-MM-dd hh:mm:ss')
setData('application/x-copyq-user-copy-time', time)

var tagsMime = 'application/x-copyq-tags'
var tags = str(data(tagsMime)) + ', ' + time
setData(tagsMime, tags)
```

It had two problems:

1. When `data(tagsMime)` was empty, concatenation produced
   `, 2026-09-27 12:24:31`, which CopyQ displays as a blank first tag followed
   by the timestamp.
2. The timestamp was stored twice: once as a visible tag and again in the
   custom `application/x-copyq-user-copy-time` format.

The long-form corrected command keeps only the visible tag and does not create
the leading comma:

```js
copyq:

var time = dateString('yyyy-MM-dd hh:mm:ss')
var tagsMime = 'application/x-copyq-tags'
var tags = str(data(tagsMime))

if (tags) {
    setData(tagsMime, tags + ', ' + time)
} else {
    setData(tagsMime, time)
}
```

The short conditional form is equivalent:

```js
setData(tagsMime, tags ? tags + ', ' + time : time)
```

It means: if `tags` is non-empty, append comma, space, and the new timestamp;
otherwise store only the timestamp.

## Why the first repair implementation was too slow

The first `fix-leading-comma-tags.js` implementation handled every item
individually. Per row it read the tag value, possibly changed it, read the full
format-name list, and possibly removed the custom copy-time format. It repaired
only 5,161 items in about two minutes. At that rate, roughly 87,000 items would
take well over half an hour, aside from any slowdown as CopyQ updated its model.

The optimized implementation uses these CopyQ behaviors:

- `ItemSelection(tab).select(regex, mime)` selects only items containing the
  requested MIME value and matching the expression.
- `rows()` returns affected row numbers.
- `itemsFormat(mime)` fetches only that one MIME payload per selected item.
- For a MIME-scoped selection, `/^/` matches values including the empty value,
  allowing all items that contain `application/x-copyq-user-copy-time` to be
  selected without scanning each item's complete format list.
- `change(startRow, Item[])` updates consecutive items in a single model call.
  Each item in the array can be a partial MIME map. CopyQ merges that map into
  the existing item, so unmentioned MIME formats are retained.
- Assigning `undefined` to a MIME key removes only that format.
- Because `change(startRow, Item[])` operates on consecutive rows, the script
  splits affected rows into consecutive batches, with a maximum batch size of
  500.

This changes the expensive operation from multiple API/model calls per one of
roughly 87,000 rows to two targeted selections plus batched model updates only
for affected rows.

## Repair verification without reading clipboard contents

A future session can verify the cleanup by counting MIME-scoped selections.
Do not print the selected values.

```js
copyq:

var leadingCommas = ItemSelection('&clipboard')
    .select(/^\s*,/, 'application/x-copyq-tags')
    .length

var redundantCopyTimes = ItemSelection('&clipboard')
    .select(/^/, 'application/x-copyq-user-copy-time')
    .length

print('Leading-comma tags: ' + leadingCommas + '\n')
print('Redundant copy-time formats: ' + redundantCopyTimes + '\n')
```

Both counts should be zero after a fully successful repair. This check reads
only the two CopyQ-specific formats and prints counts, not clipboard text,
HTML, images, or tag values.

## Validation performed during this session

- JavaScript syntax validation passed for the optimized repair script.
- `git diff --check` passed after the optimization.
- A mock test covered non-consecutive affected rows, removal of a leading
  comma, removal of a non-empty and an empty custom copy-time value,
  preservation of unrelated MIME data, and multiple batch calls.
- The user subsequently reported that the optimized script works.
- Live post-repair zero-count verification was not captured, so a future
  session should use the count-only check above if proof is needed.

## Repository state at handoff

- Branch observed while writing this note: `new-cleanup`.
- Latest observed commit: `66f8676 cleanup leading comma`.
- The optimized batched version of `fix-leading-comma-tags.js` and its README
  explanation were still uncommitted working-tree changes when this note was
  created. Run `git status --short` rather than assuming that remains true.
- This handoff file is also a new working-tree file unless the user commits it.
- The user may commit between sessions; preserve their changes and inspect the
  current diff before editing.

## Old and experimental scripts

Treat the remaining older scripts as experiments rather than recommended
cleanup tools:

- `list-big-items.js` measures only `text/plain` character counts.
- `delete-big-items.js` and `delete-empty.js` delete items automatically and
  should not be used for discovery.
- `move-empty.js` was an older attempt centered on missing/empty `text/plain`,
  not complete item size.
- `manual.js` and `empty.js` are small debugging experiments and can expose
  clipboard text if run.

Read `README.md` and the current script before running anything that mutates
live CopyQ data.

## Recommended next-session checklist

1. Do not read the backup directory or dump live clipboard contents.
2. Run `git status --short` and inspect any existing user changes.
3. Check whether clipboard monitoring is still disabled; do not enable it
   without the user's intent.
4. If tag cleanup proof is needed, run only the two count queries above.
5. Inspect `&Biggest 50` in the CopyQ UI and manage the moved items there.
6. Before running `biggest-items.js` again, make sure `&Biggest 50` is empty,
   deleted, or renamed.
7. Remember that moving or deleting entries invalidates old source row numbers.
8. Prefer new scripts that are read-only or move into a review tab. Avoid
   automatic bulk deletion unless explicitly requested and backed up.
