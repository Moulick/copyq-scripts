// One-time repair for CopyQ tags that start with an empty comma separator.
//
// Only application/x-copyq-tags is read or changed. Clipboard text, HTML,
// images, and other item formats are not read.

var TAB_NAME = "&clipboard";
var TAGS_MIME = "application/x-copyq-tags";

var monitoringWasEnabled = monitoring();
var fixedItems = 0;
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

            if (!/^\s*,/.test(tags)) {
                continue;
            }

            // Remove one leading empty tag and the whitespace around it.
            var fixedTags = tags.replace(/^\s*,\s*/, "");

            if (fixedTags.length > 0) {
                change(row, TAGS_MIME, fixedTags);
            } else {
                change(row, TAGS_MIME, undefined);
            }

            fixedItems++;
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
    "Fixed " + fixedItems + " item(s) in \"" + TAB_NAME +
    "\" by removing the leading empty tag separator.\n"
);

if (failedItems.length > 0) {
    print("\nWARNING: " + failedItems.length + " item(s) failed:\n");

    for (var i = 0; i < failedItems.length; i++) {
        var failure = failedItems[i];
        print("  script-row=" + failure.row + ": " + failure.error + "\n");
    }

    fail();
}
