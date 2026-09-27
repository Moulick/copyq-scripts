// Fast one-time repair for CopyQ's old "Store Copy Time" command.
//
// The script bulk-selects only the two relevant MIME formats and applies
// partial item changes in batches. Clipboard text, HTML, images, and other item
// formats are not loaded into the script or changed.

var TAB_NAME = "&clipboard";
var TAGS_MIME = "application/x-copyq-tags";
var COPY_TIME_MIME = "application/x-copyq-user-copy-time";
var BATCH_SIZE = 500;
var PROGRESS_INTERVAL = 5000;

var monitoringWasEnabled = monitoring();
var itemCount = 0;
var fixedTagItems = 0;
var removedCopyTimeItems = 0;
var processedItems = 0;
var fatalError = null;

if (monitoringWasEnabled) {
    disable();
}

try {
    try {
        tab(TAB_NAME);
        itemCount = size();

        // Select and fetch only tag values that need the comma repair.
        var tagSelection = ItemSelection(TAB_NAME).select(/^\s*,/, TAGS_MIME);
        var tagRows = tagSelection.rows();
        var tagValues = tagSelection.itemsFormat(TAGS_MIME);
        var tagEntries = [];

        for (var tagIndex = 0; tagIndex < tagRows.length; tagIndex++) {
            tagEntries.push({
                row: tagRows[tagIndex],
                value: tagValues[tagIndex]
            });
        }

        tagEntries.sort(function (a, b) {
            return a.row - b.row;
        });

        // A regular expression that matches an empty string selects every item
        // containing the specified MIME format, including an empty value.
        var copyTimeSelection = ItemSelection(TAB_NAME).select(/^/, COPY_TIME_MIME);
        var copyTimeRows = copyTimeSelection.rows();
        copyTimeRows.sort(function (a, b) {
            return a - b;
        });

        var tagPosition = 0;
        var copyTimePosition = 0;
        var nextProgress = PROGRESS_INTERVAL;

        while (
            tagPosition < tagEntries.length ||
            copyTimePosition < copyTimeRows.length
        ) {
            var nextTagRow = tagPosition < tagEntries.length
                ? tagEntries[tagPosition].row
                : itemCount;
            var nextCopyTimeRow = copyTimePosition < copyTimeRows.length
                ? copyTimeRows[copyTimePosition]
                : itemCount;
            var batchStart = Math.min(nextTagRow, nextCopyTimeRow);
            var changes = [];
            var batchTagFixes = 0;
            var batchCopyTimeRemovals = 0;

            while (changes.length < BATCH_SIZE) {
                nextTagRow = tagPosition < tagEntries.length
                    ? tagEntries[tagPosition].row
                    : itemCount;
                nextCopyTimeRow = copyTimePosition < copyTimeRows.length
                    ? copyTimeRows[copyTimePosition]
                    : itemCount;

                var row = Math.min(nextTagRow, nextCopyTimeRow);
                var expectedRow = batchStart + changes.length;

                if (row >= itemCount || row !== expectedRow) {
                    break;
                }

                var itemChanges = {};

                if (nextTagRow === row) {
                    var tags = str(tagEntries[tagPosition].value);
                    var fixedTags = tags.replace(/^\s*,\s*/, "");
                    itemChanges[TAGS_MIME] = fixedTags.length > 0
                        ? fixedTags
                        : undefined;
                    tagPosition++;
                    batchTagFixes++;
                }

                if (nextCopyTimeRow === row) {
                    itemChanges[COPY_TIME_MIME] = undefined;
                    copyTimePosition++;
                    batchCopyTimeRemovals++;
                }

                changes.push(itemChanges);
            }

            // change(row, Item[]) merges these partial maps into consecutive
            // items in one model update; unmentioned MIME formats are retained.
            change(batchStart, changes);

            fixedTagItems += batchTagFixes;
            removedCopyTimeItems += batchCopyTimeRemovals;
            processedItems += changes.length;

            if (processedItems >= nextProgress) {
                print(
                    "Processed " + processedItems + " affected item(s) of " +
                    itemCount + " total.\n"
                );
                nextProgress += PROGRESS_INTERVAL;
            }
        }
    } catch (error) {
        fatalError = String(error);
    }
} finally {
    tab(TAB_NAME);

    if (monitoringWasEnabled) {
        enable();
    }
}

print(
    "Fixed leading commas in " + fixedTagItems + " item(s) and removed \"" +
    COPY_TIME_MIME + "\" from " + removedCopyTimeItems + " item(s) in \"" +
    TAB_NAME + "\".\n"
);

if (fatalError !== null) {
    print(
        "Stopped after processing " + processedItems +
        " affected item(s): " + fatalError + "\n" +
        "The script is safe to run again.\n"
    );
    fail();
}
