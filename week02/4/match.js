/**
 * 找到字符串中是否含有ab
 * @param {*} string 
 */
function match(string) {
  let foundA = false;
  for (let c of string) {
    if (c === "a") {
      foundA = true;
    }
    if (c === "b" && foundA) {
      return true;
    }
    if (c !== "a") {
      foundA = false;
    }
  }
  return false;
}

console.log(match("I am abgroot."))