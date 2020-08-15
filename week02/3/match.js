/**
 * 找到字符串中是否含有a
 * @param {*} string 
 */
function match(string) {
  for (let c of string) {
    if (c === "a") {
      return true;
    }
  }
  return false;
}

match("I am groot");