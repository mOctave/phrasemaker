const fs = require("fs")
const path = require("path")

class Phrasemaker {
	constructor(settingsPath) {
		this.userSettings = JSON.parse(fs.readFileSync(
			path.resolve(settingsPath), "utf-8"))
		this.defaultSettings = JSON.parse(fs.readFileSync(
			"./settings.json", "utf-8"))

		if (this.userSettings.dictionary) {
			this.dictionary = JSON.parse(fs.readFileSync(
				path.resolve(this.userSettings.dictionary), "utf-8"))
		} else {
			this.dictionary = require(this.defaultSettings.dictionary)
		}

		if (this.userSettings.phrasebook) {
			this.phrasebook = JSON.parse(fs.readFileSync(
				path.resolve(this.userSettings.phrasebook), "utf-8"))
		} else {
			this.phrasebook = require(this.defaultSettings.phrasebook)
		}

		this.entrypoint = this.userSettings.entrypoint
			|| this.defaultSettings.entrypoint
		this.includeOffensive = this.userSettings.includeOffensive
			|| this.defaultSettings.includeOffensive
	}

	// Generates any number of phrases according to the standard settings.
	generate(number) {
		let phrases = []
		for (let i = 0; i < number; i++) {
			phrases.push(this.getPhrase(this.entrypoint, this.includeOffensive))
		}

		return phrases
	}

	// Gets a specific phrase from the phrasebook based on the entrypoint.
	// Call this directly instead of using run() for fine-grained control
	// over the entrypoint and offensiveness settings.
	getPhrase(entrypoint, includeOffensive) {
		let phrase = ""
		if (!this.phrasebook[entrypoint]) {
			return "[Error: Phrase does not exist.]"
		}
		for (let i in this.phrasebook[entrypoint]) {
			let node = this.phrasebook[entrypoint][i]
			let selection = ""

			// Add node
			if (node.type === "space") {
				phrase += " "
				continue
			} else if (node.type === "word") {
				if (includeOffensive && node.offensive !== undefined) {
					selection = Phrasemaker.rand(node.choices.concat(node.offensive))
				} else {
					selection = Phrasemaker.rand(node.choices)
				}
			} else if (node.type === "phrase") {
				selection = this.getPhrase(Phrasemaker.rand(node.choices), includeOffensive)
			} else {
				console.log("Unsupported node type: " + node.type)
			}

			// Fill in substitutions
			let matches = selection.matchAll(/\{(.+)\}/g)
			for (let match of matches) {
				selection = selection.replace(match[0], this.getPhrase(match[1], includeOffensive))
			}

			let words = selection.split(" ")

			// Conjugate first verb
			if (
				node.tense !== undefined
				&& node.tense !== "infinitive"
				&& !words[0].startsWith("{")
			) {
				words[0] = this.conjugate(words[0].toLowerCase(), node.tense)
			}

			// Add preceding article
			if (node.article !== undefined && node.article !== "none") {
				if (node.article == "definite") {
					words.unshift("the")
				} else if (node.article == "indefinite") {
					if (this.beginsWithVowelSound(words[0].toLowerCase())) {
						words.unshift("an")
					} else {
						words.unshift("a")
					}
				}
			}

			selection = ""
			for (let word of words) {
				selection += word + " "
			}

			selection.trim()

			phrase += selection
		}

		phrase = phrase.replace(/\s+/g, " ").trim()

		return phrase
	}

	/**
	 * Checks the dictionary to see if a word begins with a vowel sound or not
	 * @param {*} word A lowercase word to match against the dictionary
	 * @returns true if the chosen word begins with a vowel sound, false otherwise
	 */
	beginsWithVowelSound(word) {
		let isVowelSound = false

		if (
			this.dictionary[word] &&
			this.dictionary[word].beginsWithVowelSound !== undefined
		) {
			return (dictionary[word].beginsWithVowelSound === true)
		}

		for (let vowelSound of this.dictionary["#vowel sounds"]) {
			let re = new RegExp(vowelSound)
			if (re.test(word)) {
				isVowelSound = true
			}
		}
		for (let consonantSound of this.dictionary["#consonant sounds"]) {
			let re = new RegExp(consonantSound)
			if (re.test(word)) {
				isVowelSound = false
			}
		}

		return isVowelSound
	}

	/**
	 * Conjugates a verb into a specific tense based on its conjugation rules defined
	 * in the dictionary, or standard conjugation rules if none are defined.
	 * @param {*} verb The verb to conjugate
	 * @param {*} tense The tense to conjugate the verb into
	 * @returns the conjugated verb
	 */
	conjugate(verb, tense) {
		if (
			this.dictionary[verb] &&
			this.dictionary[verb][tense] !== undefined
		) {
			return this.dictionary[verb][tense]
		}

		let verbNoE = verb
		if (verb.endsWith("e"))
			verbNoE = verb.slice(0, -1)

		return (
			this.dictionary["#verb conjugations"][tense]
				.replace("<verb>", verb)
				.replace("<verb-e>", verbNoE)
		)
	}

	// Gets a random item from an array
	static rand(array) {
		return array[Math.floor(Math.random() * array.length)]
	}
}

module.exports = Phrasemaker
