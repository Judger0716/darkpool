arr = [];
console.log(arr.length);
arr = [...arr, { name: "aa", amount: "2" }, { name: "b", amount: "8" }, { name: "ac", amount: "1" }];
console.log(arr.length);
arr.sort(function (a, b) { return parseInt(b.amount) - parseInt(a.amount); });
console.log(arr);
console.log(arr.slice(0, 2));

var arr = [1, 4, 10, 5, 8];

for (i in arr) {
  if (i == 4) {
    i = 4564;
  }
}

console.log(arr)