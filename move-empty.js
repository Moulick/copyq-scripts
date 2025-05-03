// Script to backup items missing text/plain format in CopyQ

// Hardcoded name of the original tab
var originalTabName = "&clipboard";

// Switch to the original tab
tab(originalTabName);

// Get the total number of items in the original tab
var totalItems = size();

// Create a new tab for backup
var backupTabName = "Backup_Missing_TextPlain";
tab(backupTabName); // Switch to the backup tab (creates it if it doesn't exist)

// Print the header with user info and timestamp
print("\n==============================================");
print("\nBacking up Items Missing text/plain Format in CopyQ");
print("\nOriginal Tab: " + originalTabName);
print("\nBackup Tab: " + backupTabName);
print("\n==============================================");

// Switch back to the original tab
tab(originalTabName);

// Flag to track if any missing items are found
var foundMissing = false;

// Loop through all items in reverse order to avoid re-indexing issues
for (var i = totalItems - 1; i >= 0; i--) {
    // Try to read the item as text/plain
    var textPlainData = read("text/plain", i);

    // Check if the length of the text/plain data is 0
    if (textPlainData.length === 0) {
        // Mark that we found at least one missing item
        foundMissing = true;

        // Get the entire item data (all formats) using getItem()
        var itemData = getItem(i);

        // Switch to the backup tab
        tab(backupTabName);

        // Add the item to the backup tab using setItem()
        setItem(0, itemData); // Adds the item at the top of the backup tab

        // Switch back to the original tab
        tab(originalTabName);

        // Print the item number (1-based indexing)
        print("\nItem #" + (i + 1) + " backed up.");
    }
}

// Print a message if no items were missing text/plain
if (!foundMissing) {
    print("\nNo items missing text/plain format found in clipboard history.");
}

// Print summary
print("\n----------");
print("\nTotal items scanned: " + totalItems);
