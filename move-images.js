// Move image items from the main clipboard tab into a dedicated image tab.
//
// The source is processed from bottom to top so removing an item cannot change
// the row numbers that are still waiting to be checked. Clipboard monitoring is
// paused during the move and restored to its original state afterward.

var SOURCE_TAB = "&clipboard";
var DESTINATION_TAB = "&Images";

function ensureTabExists(tabName) {
    var tabNames = tab();

    for (var i = 0; i < tabNames.length; i++) {
        if (tabNames[i] === tabName) {
            return;
        }
    }

    tabNames.push(tabName);
    config("tabs", tabNames);
}

function isImageMimeType(mimeType) {
    return mimeType.indexOf("image/") === 0 ||
        mimeType === "application/x-qt-image";
}

function rowContainsImage(row) {
    // Asking for "?" returns format names only; it does not read the payloads.
    var mimeTypes = str(read("?", row)).split("\n");

    for (var i = 0; i < mimeTypes.length; i++) {
        if (isImageMimeType(mimeTypes[i])) {
            return true;
        }
    }

    return false;
}

if (SOURCE_TAB === DESTINATION_TAB) {
    throw new Error("Source and destination tabs must be different");
}

var monitoringWasEnabled = monitoring();
var movedItems = 0;
var failedItems = [];

if (monitoringWasEnabled) {
    disable();
}

try {
    ensureTabExists(DESTINATION_TAB);

    tab(SOURCE_TAB);
    var sourceItemCount = size();

    for (var row = sourceItemCount - 1; row >= 0; row--) {
        var insertedIntoDestination = false;

        try {
            if (!rowContainsImage(row)) {
                continue;
            }

            // Load the complete item only after its MIME names identify it as
            // an image. This preserves text, HTML, metadata, and every other
            // format stored alongside the image.
            var item = getItem(row);

            tab(DESTINATION_TAB);
            var destinationSizeBefore = size();
            write(0, item);
            insertedIntoDestination = true;

            if (size() !== destinationSizeBefore + 1) {
                throw new Error("Destination item count did not increase");
            }

            tab(SOURCE_TAB);
            remove(row);
            movedItems++;

            // Do not retain the image payload after this iteration.
            item = null;
        } catch (error) {
            tab(SOURCE_TAB);
            failedItems.push({
                row: row,
                error: String(error),
                copied: insertedIntoDestination
            });
        }
    }
} finally {
    tab(SOURCE_TAB);

    if (monitoringWasEnabled) {
        enable();
    }
}

print(
    "Moved " + movedItems + " image item(s) from \"" + SOURCE_TAB +
    "\" to \"" + DESTINATION_TAB + "\".\n"
);

if (failedItems.length > 0) {
    print("\nWARNING: " + failedItems.length + " item(s) failed:\n");

    for (var i = 0; i < failedItems.length; i++) {
        var failure = failedItems[i];
        print(
            "  script-row=" + failure.row + ": " + failure.error +
            (failure.copied
                ? " (copied to destination but not removed from source)"
                : "") +
            "\n"
        );
    }
}
