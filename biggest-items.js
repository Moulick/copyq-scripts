// Move the largest items from the main CopyQ tab into a review tab.
//
// Item size is the sum of every stored MIME payload. Complete items are moved,
// preserving all formats and metadata. The destination is sorted largest-first.

var SOURCE_TAB = "&clipboard";
var DESTINATION_TAB = "&Biggest 50";
var MOVE_COUNT = 50;

function byteLength(data) {
    if (data === null || data === undefined) {
        return 0;
    }

    if (typeof data.size === "function") {
        return data.size();
    }
    return data.length || 0;
}

function rememberLargest(largest, candidate) {
    largest.push(candidate);
    largest.sort(function (a, b) {
        if (a.bytes !== b.bytes) {
            return b.bytes - a.bytes;
        }
        return b.row - a.row;
    });

    if (largest.length > MOVE_COUNT) {
        largest.pop();
    }
}

function ensureEmptyDestination() {
    var tabNames = tab();
    var destinationExists = false;

    for (var i = 0; i < tabNames.length; i++) {
        if (tabNames[i] === DESTINATION_TAB) {
            destinationExists = true;
            break;
        }
    }

    if (!destinationExists) {
        tabNames.push(DESTINATION_TAB);
        config("tabs", tabNames);
    }

    tab(DESTINATION_TAB);
    if (size() !== 0) {
        throw new Error(
            "Destination tab \"" + DESTINATION_TAB +
            "\" is not empty; clear or rename it before running this script"
        );
    }
}

function destinationRowFor(movedItems, bytes) {
    var row = 0;

    while (row < movedItems.length && movedItems[row].bytes >= bytes) {
        row++;
    }

    return row;
}

if (SOURCE_TAB === DESTINATION_TAB) {
    throw new Error("Source and destination tabs must be different");
}

var monitoringWasEnabled = monitoring();
var sourceItemCount = 0;
var largest = [];
var scanFailures = [];
var movedItems = [];
var fatalError = null;
var insertedBeforeFailure = false;

if (monitoringWasEnabled) {
    disable();
}

try {
    try {
        ensureEmptyDestination();

        tab(SOURCE_TAB);
        sourceItemCount = size();

        // Scan all MIME payloads but retain only row numbers and byte totals.
        for (var row = 0; row < sourceItemCount; row++) {
            try {
                var item = getItem(row);
                var itemBytes = 0;

                for (var mimeType in item) {
                    itemBytes += byteLength(item[mimeType]);
                }

                rememberLargest(largest, {
                    row: row,
                    itemNumber: row + 1,
                    bytes: itemBytes
                });

                item = null;
            } catch (error) {
                scanFailures.push({
                    row: row,
                    error: String(error)
                });
            }
        }

        if (scanFailures.length === 0) {
            // Removing source rows from bottom to top prevents remaining source
            // row numbers from shifting. Destination insertion positions keep
            // the review tab ordered by size, largest first.
            largest.sort(function (a, b) {
                return b.row - a.row;
            });

            for (var i = 0; i < largest.length; i++) {
                var candidate = largest[i];
                insertedBeforeFailure = false;

                tab(SOURCE_TAB);
                var sourceItem = getItem(candidate.row);

                tab(DESTINATION_TAB);
                var destinationSizeBefore = size();
                var destinationRow = destinationRowFor(movedItems, candidate.bytes);
                write(destinationRow, sourceItem);
                insertedBeforeFailure = true;

                if (size() !== destinationSizeBefore + 1) {
                    throw new Error("Destination item count did not increase");
                }

                tab(SOURCE_TAB);
                remove(candidate.row);

                movedItems.splice(destinationRow, 0, candidate);
                sourceItem = null;
            }
        }
    } catch (error) {
        fatalError = String(error);
    }
} finally {
    tab(SOURCE_TAB);

    if (monitoringWasEnabled) {
        enable();
    }
}

print("Scanned " + sourceItemCount + " item(s) in \"" + SOURCE_TAB + "\".\n");

if (scanFailures.length > 0) {
    print(
        "No items were moved because " + scanFailures.length +
        " item(s) could not be measured:\n"
    );

    for (var failureIndex = 0; failureIndex < scanFailures.length; failureIndex++) {
        var failure = scanFailures[failureIndex];
        print("  script-row=" + failure.row + ": " + failure.error + "\n");
    }

    fail();
}

if (fatalError !== null) {
    print(
        "Moved " + movedItems.length + " item(s) before an error occurred: " +
        fatalError + "\n"
    );

    if (insertedBeforeFailure) {
        print(
            "The last item may exist in both tabs because destination insertion " +
            "succeeded before the source operation failed.\n"
        );
    }

    fail();
}

print(
    "Moved " + movedItems.length + " largest item(s) to \"" +
    DESTINATION_TAB + "\", ordered largest first.\n"
);
