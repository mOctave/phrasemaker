const Phrasemaker = require("./index.js");

const gen = new Phrasemaker("./settings.json");
console.log(gen.generate(5));
console.log(gen.getPhrase("secondary", false));
