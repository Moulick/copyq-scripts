// Read-only report of the largest items stored in CopyQ.
//
// The script never prints clipboard contents. It reports only tab names, row
// numbers, MIME type names, and byte counts.

var TAB_NAME = "&clipboard";
var TOP_COUNT = 30;

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

function itemKind(formats) {
    var hasText = false;
    var hasHtml = false;
    var hasFiles = false;

    for (var i = 0; i < formats.length; i++) {
        var mimeType = formats[i].mimeType;

        if (mimeType.indexOf("image/") === 0 || mimeType === "application/x-qt-image") {
            return "image";
        }
        if (mimeType.indexOf("video/") === 0) {
            return "video";
        }
        if (mimeType.indexOf("audio/") === 0) {
            return "audio";
        }
        if (mimeType === "text/uri-list") {
            hasFiles = true;
        } else if (mimeType === "text/html") {
            hasHtml = true;
        } else if (mimeType === "text/plain") {
            hasText = true;
        }
    }

    if (hasFiles) {
        return "files/URLs";
    }
    if (hasHtml) {
        return "rich text";
    }
    if (hasText) {
        return "text";
    }
    return "other";
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
            kind: itemKind(formats),
            formats: formats
        });

        // Do not retain a reference to any clipboard payload after this row.
        item = null;
    } catch (error) {
        failedItems++;
    }
}

itemCountChanged = size() !== initialItemCount;

print("CopyQ largest-item report (contents omitted)\n");
print("Tab: \"" + TAB_NAME + "\"\n");
print("Scanned " + initialItemCount + " item(s)\n");
print("Total MIME payload measured: " + formatBytes(totalBytes) + "\n");

print("\nTop " + Math.min(TOP_COUNT, largest.length) + " largest item(s):\n");
for (var rank = 0; rank < largest.length; rank++) {
    var result = largest[rank];
    print(
        "\n#" + (rank + 1) +
        "  " + formatBytes(result.bytes) +
        "  " + result.kind +
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
        "while clipboard history is idle before using row numbers.\n"
    );
}

print(
    "\nSizes are the sum of stored MIME payloads. The CopyQ data directory and " +
    "backups also contain metadata and may use a different amount of disk space.\n"
);
