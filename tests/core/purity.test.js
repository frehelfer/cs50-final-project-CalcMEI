import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '../..');
const CORE_DIR = path.join(ROOT, 'public/scripts/core');
const PRESENTER = path.join(ROOT, 'public/scripts/presenter.js');
const TESTS_DIR = path.join(ROOT, 'tests');
const BROWSER_SCRIPTS = ['calculator.js', 'calculator-dom.js', 'presenter.js', 'accordion.js'].map((name) =>
	path.join(ROOT, 'public/scripts', name)
);

/**
 * Removes comments, string literals and regex literals from JS source, keeping the code
 * (including the code inside template literal expressions).
 * @param {string} source
 * @param {string[] | null} [commentSink] Receives the text of every comment, when given.
 * @returns {string}
 */
function stripLiteralsAndComments(source, commentSink = /** @type {string[] | null} */ (null)) {
	let out = '';
	let i = 0;

	/** Scans code until the end, or until the closing brace of a template expression. */
	function scanCode(/** @type {boolean} */ insideTemplate) {
		let depth = 0;
		while (i < source.length) {
			const ch = source[i];
			const next = source[i + 1];
			if (ch === '/' && next === '/') {
				const start = i;
				while (i < source.length && source[i] !== '\n') i++;
				commentSink?.push(source.slice(start + 2, i));
			} else if (ch === '/' && next === '*') {
				const end = source.indexOf('*/', i + 2);
				commentSink?.push(source.slice(i + 2, end === -1 ? source.length : end));
				i = end === -1 ? source.length : end + 2;
			} else if (ch === "'" || ch === '"') {
				i++;
				while (i < source.length && source[i] !== ch && source[i] !== '\n') {
					i += source[i] === '\\' ? 2 : 1;
				}
				i++;
				out += ' ';
			} else if (ch === '`') {
				i++;
				scanTemplate();
				out += ' ';
			} else if (ch === '/' && startsRegex()) {
				i++;
				let inClass = false;
				while (i < source.length && (source[i] !== '/' || inClass) && source[i] !== '\n') {
					if (source[i] === '\\') i++;
					else if (source[i] === '[') inClass = true;
					else if (source[i] === ']') inClass = false;
					i++;
				}
				i++;
				out += ' ';
			} else {
				if (insideTemplate) {
					if (ch === '{') depth++;
					if (ch === '}') {
						if (depth === 0) return;
						depth--;
					}
				}
				out += ch;
				i++;
			}
		}
	}

	/** Skips a template literal body, scanning the code of its `${}` expressions. */
	function scanTemplate() {
		while (i < source.length && source[i] !== '`') {
			if (source[i] === '\\') {
				i += 2;
			} else if (source[i] === '$' && source[i + 1] === '{') {
				i += 2;
				out += ' ';
				scanCode(true);
				i++; // closing brace
			} else {
				i++;
			}
		}
		i++; // closing backtick
	}

	function startsRegex() {
		const before = out.trimEnd();
		if (before === '') return true;
		if ('(,=:[!&|?{};+-*%<>~^'.includes(before[before.length - 1])) return true;
		return /(?:^|[^\w$])(?:return|typeof|case|in|of)$/.test(before);
	}

	scanCode(false);
	return out;
}

/**
 * @param {string} dir
 * @returns {string[]} Every .js file under dir, recursively.
 */
function listJsFiles(dir) {
	/** @type {string[]} */
	const files = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) files.push(...listJsFiles(full));
		else if (entry.name.endsWith('.js')) files.push(full);
	}
	return files;
}

function coreAndPresenterFiles() {
	const files = listJsFiles(CORE_DIR);
	if (fs.existsSync(PRESENTER)) files.push(PRESENTER);
	return files;
}

const DOM_REFERENCE =
	/\b(document|window|globalThis|self|location|navigator|localStorage|sessionStorage|fetch|XMLHttpRequest|HTMLElement|Element|Node|Event|CustomEvent|querySelector|querySelectorAll|getElementById|getElementsBy\w+|addEventListener|removeEventListener|dispatchEvent|innerHTML|innerText|outerHTML|textContent|classList|setAttribute|getAttribute|createElement|appendChild)\b/;

// Portuguese domain words that must not appear in identifiers or file names.
// "calcul(?!at)" keeps the English "calculate" legal.
// "limite(?!d)" keeps "limited", "conta(?!in|ct)" keeps "contains"/"contact".
const PT_WORDS =
	/receita|lucro|despesa|regra|exercicio|calcul(?!at)|moeda|servico|comercio|transporte|resultado|apresent|isent|isenc|limite(?!d)|tributav|declarac|valor|anocalend|rendiment|obrigat|atualiza|referencia|presunc|imposto|entrada|conta(?!in|ct)/i;

/**
 * @param {string} code Source already stripped of strings and comments.
 * @returns {string[]} Identifiers that contain a Portuguese domain word.
 */
function portugueseIdentifiers(code) {
	const identifiers = code.match(/[A-Za-z_$][\w$]*/g) ?? [];
	return identifiers.filter((name) => PT_WORDS.test(name));
}

/**
 * @param {string} text Free text (a comment or a test title). Quoted parts are user-facing text and skipped.
 * @returns {string[]} Words that are Portuguese domain words or carry accented letters.
 */
function portugueseWords(text) {
	const unquoted = text.replace(/"[^"]*"|'[^']*'|“[^”]*”|`[^`]*`/g, ' ');
	const words = unquoted.match(/[^\s.,;:!?()[\]{}<>`'"*/\\|=+-]+/g) ?? [];
	return words.filter((word) => PT_WORDS.test(word) || /[À-ÿ]/.test(word));
}

/**
 * The titles of it/describe/test calls in a test file.
 * @param {string} source
 * @returns {string[]}
 */
function testTitles(source) {
	const titles = [...source.matchAll(/\b(?:it|describe|test)\(\s*(['"`])((?:\\.|(?!\1).)*)\1/g)].map((m) => m[2]);
	return titles;
}

/** @param {string} file */
function relative(file) {
	return path.relative(ROOT, file);
}

describe('stripLiteralsAndComments', () => {
	it('LANG-01 removes strings, template text, comments and regex literals but keeps code', () => {
		const code = stripLiteralsAndComments(
			[
				"const a = 'lucro'; // receita",
				'const b = "despesa"; /* regra */',
				'const c = `texto ${valor} fim`;',
				'const d = x.replace(/\\D+/g, "");',
			].join('\n')
		);
		expect(code).not.toMatch(/lucro|receita|despesa|regra|texto|fim/);
		expect(code).toMatch(/const a/);
		expect(code).toMatch(/valor/);
		expect(code).toMatch(/x\.replace/);
	});

	it('CALC-06 the DOM scan flags a planted document reference and ignores one in a string or comment', () => {
		expect(DOM_REFERENCE.test(stripLiteralsAndComments('const t = document.title;'))).toBe(true);
		expect(DOM_REFERENCE.test(stripLiteralsAndComments("const t = 'document'; // window"))).toBe(false);
		for (const planted of ['doc.getElementById("x")', 'el.querySelector(".a")', 'globalThis.x = 1;', 'location.href', 'fetch(url)', 'el.textContent = s;']) {
			expect(DOM_REFERENCE.test(stripLiteralsAndComments(planted)), planted).toBe(true);
		}
	});

	it('LANG-01 the language scan flags a planted Portuguese identifier and accented character', () => {
		expect(portugueseIdentifiers(stripLiteralsAndComments('const lucroApurado = 1;'))).toEqual(['lucroApurado']);
		expect(portugueseIdentifiers(stripLiteralsAndComments('function calculateIrpf() {}'))).toEqual([]);
		expect(/[^\x00-\x7f]/.test(stripLiteralsAndComments('const serviços = 1;'))).toBe(true);
		for (const name of ['isentoTotal', 'limiteAnual', 'tributavel', 'declaracao', 'valorBruto', 'anoCalendario', 'rendimento']) {
			expect(portugueseIdentifiers(stripLiteralsAndComments(`const ${name} = 1;`)), name).toEqual([name]);
		}
		expect(portugueseIdentifiers(stripLiteralsAndComments('const limited = contains + contact;'))).toEqual([]);
	});

	it('LANG-01 the comment and test-title scans flag Portuguese and ignore quoted user-facing text', () => {
		/** @type {string[]} */
		const comments = [];
		stripLiteralsAndComments('const a = 1; // lucro apurado\n/* exercício */', comments);
		expect(comments.flatMap(portugueseWords)).toEqual(['lucro', 'exercício']);
		expect(testTitles("it('CALC-05 shows \"R$ 0,00\" when netProfit is negative', () => {})").flatMap(portugueseWords)).toEqual([]);
		const plantedCall = 'i' + "t('mostra lucro negativo', () => {})"; // split so this file's own scan skips it
		expect(testTitles(plantedCall).flatMap(portugueseWords)).toEqual(['lucro']);
	});
});

describe('core and presenter purity', () => {
	it('CALC-06 no file under core/ or presenter.js references the DOM', () => {
		const offenders = coreAndPresenterFiles().filter((file) =>
			DOM_REFERENCE.test(stripLiteralsAndComments(fs.readFileSync(file, 'utf8')))
		);
		expect(offenders.map(relative)).toEqual([]);
	});

	it('TS-03 importing every module adds no globals, throws nothing and uses named exports only', async () => {
		const before = Object.getOwnPropertyNames(globalThis).sort();
		for (const file of coreAndPresenterFiles()) {
			const namespace = await import(pathToFileURL(file).href);
			expect(Object.keys(namespace), relative(file)).not.toContain('default');
		}
		const after = Object.getOwnPropertyNames(globalThis).sort();
		expect(after).toEqual(before);
	});
});

describe('English code', () => {
	const files = [
		...listJsFiles(CORE_DIR),
		...BROWSER_SCRIPTS,
		...listJsFiles(TESTS_DIR).filter((file) => !file.startsWith(path.join(TESTS_DIR, 'fixtures') + path.sep)),
	];

	it('LANG-01 there are files to scan', () => {
		expect(files.length).toBeGreaterThan(0);
	});

	it('LANG-01 no non-ASCII characters outside strings and comments', () => {
		const offenders = files.filter((file) => /[^\x00-\x7f]/.test(stripLiteralsAndComments(fs.readFileSync(file, 'utf8'))));
		expect(offenders.map(relative)).toEqual([]);
	});

	it('LANG-01 no Portuguese domain words in identifiers', () => {
		const offenders = files.flatMap((file) =>
			portugueseIdentifiers(stripLiteralsAndComments(fs.readFileSync(file, 'utf8'))).map((name) => `${relative(file)}: ${name}`)
		);
		expect(offenders).toEqual([]);
	});

	it('LANG-01 no Portuguese words or accents in comments', () => {
		const offenders = files.flatMap((file) => {
			/** @type {string[]} */
			const comments = [];
			stripLiteralsAndComments(fs.readFileSync(file, 'utf8'), comments);
			return comments.flatMap(portugueseWords).map((word) => `${relative(file)}: ${word}`);
		});
		expect(offenders).toEqual([]);
	});

	it('LANG-01 no Portuguese words or accents in test titles outside quoted user-facing text', () => {
		const testFiles = files.filter((file) => file.endsWith('.test.js'));
		expect(testFiles.length).toBeGreaterThan(0);
		const offenders = testFiles.flatMap((file) =>
			testTitles(fs.readFileSync(file, 'utf8')).flatMap(portugueseWords).map((word) => `${relative(file)}: ${word}`)
		);
		expect(offenders).toEqual([]);
	});

	it('LANG-01 no Portuguese domain words or accents in file names', () => {
		const offenders = files.filter((file) => PT_WORDS.test(path.basename(file)) || /[^\x00-\x7f]/.test(path.basename(file)));
		expect(offenders.map(relative)).toEqual([]);
	});
});
