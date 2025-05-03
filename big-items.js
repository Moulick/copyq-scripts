// Script to find and print the top 10 biggest items in CopyQ

// Get the total number of items in the current tab
var totalItems = size();
var items = [];

// Loop through all items and store their index and size
// Using 1-based indexing for display
for (var i = 0; i < totalItems; i++) {
    // Get item data as text
    var itemData = read(i, "text/plain");

    // Store the item index (1-based) and its size
    items.push({
        index: i + 1, // Adjust to 1-based indexing
        originalIndex: i, // Keep the original 0-based index for reading the data
        size: itemData ? itemData.length : 0
    });
}

// Sort items by size in descending order
items.sort(function (a, b) {
    return b.size - a.size;
});

// Print the header with user info and timestamp
print("\n==============================================");
print("\nTop 10 Biggest Items in CopyQ Clipboard");
print("\n==============================================");

// Print the top 10 items (or fewer if there aren't 10 items)
var itemsToPrint = Math.min(10, items.length);
for (var j = 0; j < itemsToPrint; j++) {
    var item = items[j];
    print("\nRank #" + (j + 1) + ": Item #" + item.index);
    print("\nSize: " + item.size + " characters");
    print("\n----------");
}

// Print summary
print("\nTotal items scanned: " + totalItems);
