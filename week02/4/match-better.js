/**
 * 找到字符串中是否含有ab
 * @param {*} string 
 */
function match(string) {
  let foundA = false;
  for (let c of string) {
    if (c === "a") {
      foundA = true;
    } else if (c === "b" && foundA) {
      return true;
    } else {
      foundA = false;
    }
  }
  return false;
}

console.log(match("I am abgroot."))