var x = read("text/plain", 6);
print(x);
print("\n");
if (x === null || x === undefined || x === "" || x.length == 0) {
    print("null");
} else {
    print("not null");
}
