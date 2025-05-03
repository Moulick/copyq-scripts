// Script to find items missing text/plain format in CopyQ

// Get the total number of items in the current tab
var totalItems = size();

// Print the header with user info and timestamp
print("\n==============================================");
print("\nItems Missing text/plain Format in CopyQ Clipboard");
print("\n==============================================");

// Flag to track if any missing items are found
var foundMissing = false;

// Loop through all items and check for missing text/plain format
for (var i = 0; i < totalItems; i++) {
    // Try to read the item as text/plain
    var textPlainData = read("text/plain", i);

    // Check if the length of the text/plain data is 0
    if (textPlainData.length === 0) {
        // Print the item number (1-based indexing)
        print("\nItem #" + (i + 1));
        foundMissing = true;
    }
}

// Print a message if no items were missing text/plain
if (!foundMissing) {
    print("\nNo items missing text/plain format found in clipboard history.");
}

// Print summary
print("\n----------");
print("\nTotal items scanned: " + totalItems);
