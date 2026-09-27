# CopyQ cleanup scripts

## Move the largest items into a review tab

`biggest-items.js` scans the hardcoded `&clipboard` tab, selects the 50 largest
items by the sum of all their MIME payloads, and moves their complete data into
`&Biggest 50`. The destination is ordered largest-first for review in the CopyQ
UI.

The script pauses clipboard capture while scanning and moves source rows from
bottom to top so their positions remain stable. It refuses to run when
`&Biggest 50` already contains items; clear, delete, or rename that tab before
starting another batch.

Run it with:

```sh
/Applications/CopyQ.app/Contents/MacOS/CopyQ source "$PWD/biggest-items.js"
```

This script changes live CopyQ data. It inserts each complete item into the
destination before removing it from `&clipboard`.

## Repair leading commas in tags

`fix-leading-comma-tags.js` is a one-time repair for tags such as
`, 2026-09-27 12:24:31`. It changes only the
`application/x-copyq-tags` field, producing `2026-09-27 12:24:31`, and leaves
all other item formats untouched.

```sh
/Applications/CopyQ.app/Contents/MacOS/CopyQ source "$PWD/fix-leading-comma-tags.js"
```

This script changes live CopyQ data and has intentionally not been run as part
of repository validation.

## Move images out of the clipboard tab

`move-images.js` moves every item containing an image MIME format from
`&clipboard` to `&Images`. It checks MIME names before loading an item's full
payload, processes source rows from bottom to top, and pauses clipboard capture
while it runs so row numbers stay stable.

The destination insertion is checked before the source item is removed. Run it
with:

```sh
/Applications/CopyQ.app/Contents/MacOS/CopyQ source "$PWD/move-images.js"
```

This script changes live CopyQ data. It has intentionally not been run as part
of repository validation.

## Find the largest images

After moving images, `biggest-images.js` scans only `&Images` and prints the 30
largest items with their MIME byte counts and CopyQ row numbers. It does not
print image contents or modify the tab.

```sh
/Applications/CopyQ.app/Contents/MacOS/CopyQ source "$PWD/biggest-images.js"
```

The other scripts in this folder are older experiments. In particular,
`delete-big-items.js` and `delete-empty.js` delete entries automatically and
should not be used for discovery. The old scripts also inspect only
`text/plain`, so they do not correctly measure image-only or rich-content
items.
