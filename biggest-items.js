// Read-only report of the largest items stored in CopyQ.
//
// The script never prints clipboard contents. It reports only item numbers and
// byte counts.

var TAB_NAME = "&clipboard";
var TOP_COUNT = 20;

function byteLength(data) {
    if (data === null || data === undefined) {
        return 0;
    }

    // CopyQ item values are ByteArray objects. The fallback also makes the
    // helper work with strings if CopyQ ever returns one for a custom format.
    if (typeof data.size === "function") {
        return data.size();
    }
    return data.length || 0;
}

function formatBytes(bytes) {
    var units = ["B", "KiB", "MiB", "GiB"];
    var value = bytes;
    var unit = 0;

    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit++;
    }

    var decimals = unit === 0 || value >= 100 ? 0 : value >= 10 ? 1 : 2;
    return value.toFixed(decimals) + " " + units[unit];
}

function rememberLargest(largest, candidate) {
    largest.push(candidate);
    largest.sort(function (a, b) {
        return b.bytes - a.bytes;
    });

    if (largest.length > TOP_COUNT) {
        largest.pop();
    }
}

var largest = [];
var totalBytes = 0;
var failedItems = 0;
var itemCountChanged = false;

tab(TAB_NAME);
var initialItemCount = size();

for (var row = 0; row < initialItemCount; row++) {
    try {
        var item = getItem(row);
        var itemBytes = 0;

        for (var mimeType in item) {
            itemBytes += byteLength(item[mimeType]);
        }

        totalBytes += itemBytes;
        rememberLargest(largest, {
            itemNumber: row + 1,
            bytes: itemBytes
        });

        // Do not retain a reference to any clipboard payload after this row.
        item = null;
    } catch (error) {
        failedItems++;
    }
}

itemCountChanged = size() !== initialItemCount;

// The set contains the largest items, but present it in descending item-number
// order so deletions can be performed from the bottom upward without changing
// the remaining reported item numbers.
largest.sort(function (a, b) {
    return b.itemNumber - a.itemNumber;
});

print("CopyQ largest-item report (contents omitted)\n");
print("Tab: \"" + TAB_NAME + "\"\n");
print("Scanned " + initialItemCount + " item(s)\n");
print("Total MIME payload measured: " + formatBytes(totalBytes) + "\n");

print(
    "\n" + Math.min(TOP_COUNT, largest.length) +
    " largest item(s), sorted by item number descending:\n"
);
for (var i = 0; i < largest.length; i++) {
    var result = largest[i];
    print("Item #" + result.itemNumber + ": " + formatBytes(result.bytes) + "\n");
}

if (failedItems > 0) {
    print("\nWARNING: " + failedItems + " item(s) could not be measured.\n");
}

if (itemCountChanged) {
    print(
        "\nWARNING: The item count changed while scanning. Run the report again " +
        "while clipboard history is idle before using item numbers.\n"
    );
}

print(
    "\nSizes are the sum of stored MIME payloads. The CopyQ data directory and " +
    "backups also contain metadata and may use a different amount of disk space.\n"
);
