const fs = require("fs")
const path = require("path")

class Phrasemaker {
	constructor(settingsPath) {
		userSettings = JSON.parse(fs.readFileSync(
			path.resolve(settingsPath), "utf-8"))
		defaultSettings = JSON.parse(fs.readFileSync(
			"./settings.json", "utf-8"))

		if (userSettings.dictionary) {
			this.dictionary = JSON.parse(fs.readFileSync(
				path.resolve(userSettings.dictionary), "utf-8"))
		} else {
			this.dictionary = require(defaultSettings.phrasebook)
		}

		if (userSettings.phrasebook) {
			this.phrasebook = JSON.parse(fs.readFileSync(
				path.resolve(userSettings.dictionary), "utf-8"))
		} else {
			this.phrasebook = require(defaultSettings.phrasebook)
		}

		this.entrypoint = userSettings.entrypoint || defaultSettings.entrypoint
		this.includeOffensive = userSettings.includeOffensive
			|| defaultSettings.includeOffensive
	}

	setup(settingFile) {
		settings = JSON.parse(fs.readFileSync(settingFile, "utf-8"))
		if (settings === undefined) {
			settings = require("./settings.json")
		}

		if (settings.phrasebook !== undefined) {
			phrasebook = require(settings.phrasebook)
		}

		if (settings.dictionary !== undefined) {
			dictionary = require(settings.dictionary)
		}

		if (settings.entrypoint !== undefined) {
			standardEntrypoint = require(entrypoint)
		}

		if (settings.includeOffensive !== undefined) {
			includeOffensive = require(settings.includeOffensive)
		}
	}

	// Generates any number of phrases according to the standard settings.
	generate(number) {
		let phrases = []
		for (let i = 0; i < number; i++) {
			phrases.append(this.getPhrase(this.entrypoint, this.includeOffensive))
		}
	}

	// Gets a specific phrase from the phrasebook based on the entrypoint.
	// Call this directly instead of using run() for fine-grained control
	// over the entrypoint and offensiveness settings.
	getPhrase(entrypoint, includeOffensive) {
		let phrase = ""
		for (let i in phrasebook[entrypoint]) {
			node = phrasebook[entrypoint][i]
			selection = ""

			// Add node
			if (node.type === "space") {
				phrase += " "
				continue
			} else if (node.type === "word") {
				if (includeOffensive && node.offensive !== undefined) {
					selection = rand(node.choices.concat(node.offensive))
				} else {
					selection = rand(node.choices)
				}
			} else if (node.type === "phrase") {
				selection = getPhrase(rand(node.choices), includeOffensive)
			} else {
				console.log("Unsupported node type: " + node.type)
			}

			words = selection.split(" ")

			// Conjugate first verb
			if (node.tense !== undefined && node.tense !== "infinitive") {
				words[0] = conjugate(words[0].toLowerCase(), node.tense)
			}

			// Add preceding article
			if (node.article !== undefined && node.article !== "none") {
				if (node.article == "definite") {
					words.unshift("the")
				} else if (node.article == "indefinite") {
					if (beginsWithVowelSound(words[0].toLowerCase())) {
						words.unshift("an")
					} else {
						words.unshift("a")
					}
				}
			}

			selection = ""
			for (word of words) {
				selection += word + " "
			}

			selection.trim()

			phrase += selection
		}

		// Fill in substitutions
		let matches = phrase.matchAll(/\{(.+)\}/g)
		for (let match of matches) {
			phrase = phrase.replace(match[0], getPhrase(match[1], includeOffensive))
		}

		phrase = phrase.replace(/\s+/g, " ").trim()

		return phrase
	}

	/**
	 * Checks the dictionary to see if a word begins with a vowel sound or not
	 * @param {*} word A lowercase word to match against the dictionary
	 * @returns true if the chosen word begins with a vowel sound, false otherwise
	 */
	static beginsWithVowelSound(word) {
		isVowelSound = false

		if (
			dictionary[word] !== undefined &&
			dictionary[word].beginsWithVowelSound != undefined
		) {
			return (dictionary[word].beginsWithVowelSound === true)
		}

		for (vowelSound of dictionary["#vowel sounds"]) {
			let re = new RegExp(vowelSound)
			if (re.test(word)) {
				isVowelSound = true
			}
		}
		for (consonantSound of dictionary["#consonant sounds"]) {
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
	static conjugate(verb, tense) {
		isVowelSound = false

		if (
			dictionary[verb] !== undefined &&
			dictionary[verb][tense] != undefined
		) {
			return dictionary[verb][tense]
		}

		verbNoE = verb
		if (verb.endsWith("e"))
			verbNoE = verb.slice(0, -1)

		return (
			dictionary["#verb conjugations"][tense]
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
