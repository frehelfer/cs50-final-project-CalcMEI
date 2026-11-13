import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '../..');
const CORE_DIR = path.join(ROOT, 'public/scripts/core');
const PRESENTER = path.join(ROOT, 'public/scripts/presenter.js');
const TESTS_DIR = path.join(ROOT, 'tests');

/**
 * Removes comments, string literals and regex literals from JS source, keeping the code
 * (including the code inside template literal expressions).
 * @param {string} source
 * @returns {string}
 */
function stripLiteralsAndComments(source) {
	let out = '';
	let i = 0;

	/** Scans code until the end, or until the closing brace of a template expression. */
	function scanCode(/** @type {boolean} */ insideTemplate) {
		let depth = 0;
		while (i < source.length) {
			const ch = source[i];
			const next = source[i + 1];
			if (ch === '/' && next === '/') {
				while (i < source.length && source[i] !== '\n') i++;
			} else if (ch === '/' && next === '*') {
				const end = source.indexOf('*/', i + 2);
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

const DOM_REFERENCE = /\b(document|window|HTMLElement|navigator|localStorage|sessionStorage)\b/;

// Portuguese domain words that must not appear in identifiers or file names.
// "calcul(?!at)" keeps the English "calculate" legal.
const PT_WORDS = /receita|lucro|despesa|regra|exercicio|calcul(?!at)|moeda|servico|comercio|transporte|resultado|apresent/i;

/**
 * @param {string} code Source already stripped of strings and comments.
 * @returns {string[]} Identifiers that contain a Portuguese domain word.
 */
function portugueseIdentifiers(code) {
	const identifiers = code.match(/[A-Za-z_$][\w$]*/g) ?? [];
	return identifiers.filter((name) => PT_WORDS.test(name));
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
	});

	it('LANG-01 the language scan flags a planted Portuguese identifier and accented character', () => {
		expect(portugueseIdentifiers(stripLiteralsAndComments('const lucroApurado = 1;'))).toEqual(['lucroApurado']);
		expect(portugueseIdentifiers(stripLiteralsAndComments('function calculateIrpf() {}'))).toEqual([]);
		expect(/[^\x00-\x7f]/.test(stripLiteralsAndComments('const serviços = 1;'))).toBe(true);
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

	it('LANG-01 no Portuguese domain words or accents in file names', () => {
		const offenders = files.filter((file) => PT_WORDS.test(path.basename(file)) || /[^\x00-\x7f]/.test(path.basename(file)));
		expect(offenders.map(relative)).toEqual([]);
	});
});
