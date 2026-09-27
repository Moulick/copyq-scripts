# CopyQ cleanup scripts

## Find the largest items safely

`biggest-items.js` scans the hardcoded `&clipboard` tab and prints only size
metadata:

- tab name
- one-based item number
- zero-based CopyQ script row
- detected content kind
- MIME format names and byte counts

It does **not** print text, images, or other clipboard contents, and it does not
modify or delete anything.

Run it while you are not copying new items so that row numbers remain stable:

```sh
/Applications/CopyQ.app/Contents/MacOS/CopyQ source "$PWD/biggest-items.js"
```

Inspect the reported items in the CopyQ UI and delete only the entries you no
longer need. `item=...` is the one-based number used by the older scripts;
`script-row=...` is the zero-based row accepted by CopyQ scripting functions.

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
