// One-time repair for CopyQ's old "Store Copy Time" command.
//
// The script removes the empty leading separator from application/x-copyq-tags
// and deletes the duplicate application/x-copyq-user-copy-time format.
// Clipboard text, HTML, images, and other item formats are not read or changed.

var TAB_NAME = "&clipboard";
var TAGS_MIME = "application/x-copyq-tags";
var COPY_TIME_MIME = "application/x-copyq-user-copy-time";

var monitoringWasEnabled = monitoring();
var fixedTagItems = 0;
var removedCopyTimeItems = 0;
var failedItems = [];

if (monitoringWasEnabled) {
    disable();
}

try {
    tab(TAB_NAME);
    var itemCount = size();

    for (var row = 0; row < itemCount; row++) {
        try {
            var tags = str(read(TAGS_MIME, row));

            if (/^\s*,/.test(tags)) {
                // Remove one leading empty tag and the whitespace around it.
                var fixedTags = tags.replace(/^\s*,\s*/, "");

                if (fixedTags.length > 0) {
                    change(row, TAGS_MIME, fixedTags);
                } else {
                    change(row, TAGS_MIME, undefined);
                }

                fixedTagItems++;
            }

            // The old command stored the same timestamp in this custom format
            // as well as in the tags field. Remove the redundant copy.
            var formats = str(read("?", row)).split("\n");
            for (var formatIndex = 0; formatIndex < formats.length; formatIndex++) {
                if (formats[formatIndex] === COPY_TIME_MIME) {
                    change(row, COPY_TIME_MIME, undefined);
                    removedCopyTimeItems++;
                    break;
                }
            }
        } catch (error) {
            failedItems.push({
                row: row,
                error: String(error)
            });
        }
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

if (failedItems.length > 0) {
    print("\nWARNING: " + failedItems.length + " item(s) failed:\n");

    for (var i = 0; i < failedItems.length; i++) {
        var failure = failedItems[i];
        print("  script-row=" + failure.row + ": " + failure.error + "\n");
    }

    fail();
}
