// Script to delete items missing text/plain format in CopyQ

// Hardcoded name of the original tab
var originalTabName = "&clipboard";

// Switch to the original tab
tab(originalTabName);

// Get the total number of items in the original tab
var totalItems = size();

// Print the header with user info and timestamp
print("\n==============================================");
print("\nDeleting Items Missing text/plain Format in CopyQ");
print("\nOriginal Tab: " + originalTabName);
print("\n==============================================");

// Flag to track if any missing items are found
var foundMissing = false;

// Loop through all items in reverse order to avoid re-indexing issues when deleting
for (var i = totalItems - 1; i >= 0; i--) {
    // Try to read the item as text/plain
    var textPlainData = read("text/plain", i);

    // Check if the length of the text/plain data is 0
    if (textPlainData.length === 0) {
        // Mark that we found at least one missing item
        foundMissing = true;

        // Delete the item from the original tab
        remove(i);

        // Print the item number (1-based indexing)
        print("\nItem #" + (i + 1) + " deleted.");
    }
}

// Print a message if no items were missing text/plain
if (!foundMissing) {
    print("\nNo items missing text/plain format found in clipboard history.");
}

// Print summary
print("\n----------");
print("\nTotal items scanned: " + totalItems);
