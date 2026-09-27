// Read-only report of the largest items in the CopyQ image tab.
//
// The script never prints clipboard contents. It reports only row numbers,
// MIME type names, and byte counts.

var TAB_NAME = "&Images";
var TOP_COUNT = 30;

function byteLength(data) {
    if (data === null || data === undefined) {
        return 0;
    }

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

tab(TAB_NAME);
var initialItemCount = size();

for (var row = 0; row < initialItemCount; row++) {
    try {
        var item = getItem(row);
        var formats = [];
        var itemBytes = 0;

        for (var mimeType in item) {
            var mimeBytes = byteLength(item[mimeType]);
            itemBytes += mimeBytes;
            formats.push({
                mimeType: mimeType,
                bytes: mimeBytes
            });
        }

        formats.sort(function (a, b) {
            return b.bytes - a.bytes;
        });

        totalBytes += itemBytes;
        rememberLargest(largest, {
            row: row,
            itemNumber: row + 1,
            bytes: itemBytes,
            formats: formats
        });

        // Do not retain a reference to any image payload after this row.
        item = null;
    } catch (error) {
        failedItems++;
    }
}

var itemCountChanged = size() !== initialItemCount;

print("CopyQ largest-image report (contents omitted)\n");
print("Tab: \"" + TAB_NAME + "\"\n");
print("Scanned " + initialItemCount + " item(s)\n");
print("Total MIME payload measured: " + formatBytes(totalBytes) + "\n");
print("\nTop " + Math.min(TOP_COUNT, largest.length) + " largest item(s):\n");

for (var rank = 0; rank < largest.length; rank++) {
    var result = largest[rank];
    print(
        "\n#" + (rank + 1) +
        "  " + formatBytes(result.bytes) +
        "  item=" + result.itemNumber +
        "  script-row=" + result.row + "\n"
    );

    for (var formatIndex = 0; formatIndex < result.formats.length; formatIndex++) {
        var format = result.formats[formatIndex];
        print("    " + formatBytes(format.bytes) + "  " + format.mimeType + "\n");
    }
}

if (failedItems > 0) {
    print("\nWARNING: " + failedItems + " item(s) could not be measured.\n");
}

if (itemCountChanged) {
    print(
        "\nWARNING: The item count changed while scanning. Run the report again " +
        "while CopyQ is idle before using row numbers.\n"
    );
}

print(
    "\nSizes are the sum of stored MIME payloads. CopyQ metadata and on-disk " +
    "storage overhead are not included.\n"
);
