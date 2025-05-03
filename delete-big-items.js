// Script to delete items larger than 50,000 characters in CopyQ

// Hardcoded name of the original tab
var originalTabName = "&clipboard";

// Switch to the original tab
tab(originalTabName);

// Get the total number of items in the original tab
var totalItems = size();

// Print the header
print("\n==============================================");
print("\nDeleting Items Larger than 25,000 Characters in CopyQ");
print("\nOriginal Tab: " + originalTabName);
print("\n==============================================");

// Flag to track if any large items are found
var foundLarge = false;

// Loop through all items in reverse order to avoid re-indexing issues when deleting
for (var i = totalItems - 1; i >= 0; i--) {
    // Get the text/plain content of the item
    var textPlainData = read("text/plain", i);

    // Check if the item exceeds 50,000 characters
    if (textPlainData.length >= 25000) {
        foundLarge = true;

        // Delete the item from the original tab
        remove(i);

        // Print the row number (1-based indexing) and character count
        print("\nItem #" + (i + 1) + " deleted. (" + textPlainData.length + " characters)");
    }
}

// Print a message if no large items were found
if (!foundLarge) {
    print("\nNo items larger than 50,000 characters found in clipboard history.");
}

// Print summary
print("\n----------");
print("\nTotal items scanned: " + totalItems);
