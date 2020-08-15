const EOF = new Symbol("EOF");

function data(c) {
  if (c == "<") {
    return tagOpen;
  } else if (c == EOF) {
    return;
  } else {
    return data;
  }
}

function tagOpen(c) {

}

module.exports.parseHTML = function parseHTML(html) {
  let state = data;
  for (let c of html) {
    state = state(c);
  }

  state = state(EOF);
}