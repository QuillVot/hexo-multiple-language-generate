const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const { ConfigManager, MultiLanguageGenerator } = require('../index');

const tests = [];

function test(name, fn) {
    tests.push({ name, fn });
}

async function runTests() {
    for (const { name, fn } of tests) {
        try {
            await fn();
            console.log(`ok - ${name}`);
        } catch (error) {
            console.error(`not ok - ${name}`);
            throw error;
        }
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function createGenerator() {
    return new MultiLanguageGenerator({
        base_dir: process.cwd(),
        render: {
            renderSync() {
                return {};
            }
        }
    });
}

function createMultiLanguageConfig() {
    return {
        'hexo-multiple-language': {
            'default-language': {
                'generate-dir': 'public',
                'config-file-name': ['config.zh']
            },
            'other-language': [
                {
                    enable: true,
                    'generate-dir': 'public-en',
                    'language-path': 'en',
                    'config-file-name': ['config.en']
                },
                {
                    enable: true,
                    'generate-dir': 'public-ja',
                    'language-path': 'ja',
                    'config-file-name': ['config.ja']
                }
            ],
            'switch-language': {
                enable: false,
                'support-theme': 'config.butterfly'
            }
        }
    };
}

function withLoadYaml(config, fn) {
    const originalLoadYaml = ConfigManager.loadYaml;
    ConfigManager.loadYaml = () => config;

    try {
        return fn();
    } finally {
        ConfigManager.loadYaml = originalLoadYaml;
    }
}

function createStorage(initial = {}) {
    const state = { ...initial };

    return {
        getItem(key) {
            return Object.prototype.hasOwnProperty.call(state, key) ? state[key] : null;
        },
        setItem(key, value) {
            state[key] = value;
        },
        removeItem(key) {
            delete state[key];
        },
        state
    };
}

function runSwitchLanguageScript(options = {}) {
    const script = fs.readFileSync(path.join(__dirname, '../lib/switch-language.js'), 'utf8');
    const storage = options.storage || createStorage();
    const context = {
        navigator: {
            language: options.language || 'en'
        },
        window: {
            location: {
                host: 'example.com',
                protocol: 'https:',
                pathname: options.pathname || '/en/',
                href: ''
            },
            localStorage: storage
        },
        document: {
            querySelectorAll() {
                return [];
            }
        },
        localStorage: storage,
        console: {
            warn() {},
            log() {},
            error() {}
        }
    };

    vm.runInNewContext(script, context);
    return context;
}

test('renders switch-language configuration with multiline defaults', () => {
    const generator = createGenerator();
    const template = fs.readFileSync(path.join(__dirname, '../lib/switch-language.js'), 'utf8');
    const rendered = generator.renderSwitchLanguageContent(template, {
        'storage-ttl': 12345,
        'default-language': ['zh', 'zh-CN'],
        'not-matched-use': 'fr',
        'other-language': {
            en: ['en', 'en-US'],
            ja: ['ja']
        }
    });

    assert.match(rendered, /const storage_ttl = 12345;/);
    assert.match(rendered, /const defaultLanguage = \["zh","zh-CN"\];/);
    assert.match(rendered, /const notMatchedLanguage = "fr";/);
    assert.match(rendered, /"en": \[\s+"en",\s+"en-US"\s+\]/);
});

test('injects switch-language script into existing inject.bottom yaml without rewriting file', () => {
    const source = [
        'menu:',
        '  Home: /',
        'inject:',
        '  head:',
        '    - <meta name="theme" content="demo">',
        '  bottom:',
        '    - <script src="/old.js"></script>',
        ''
    ].join('\n');

    const rendered = ConfigManager.injectBottomScript(source, '<script defer src="/self/js/switch-language.js"></script>');

    assert.match(rendered, /menu:\n  Home: \//);
    assert.match(rendered, /head:\n    - <meta name="theme" content="demo">/);
    assert.match(rendered, /bottom:\n    - <script src="\/old\.js"><\/script>\n    - '<script defer src="\/self\/js\/switch-language\.js"><\/script>'/);
});

test('falls back to notMatchedLanguage for unsupported browser language', () => {
    const context = runSwitchLanguageScript({
        language: 'fr',
        pathname: '/'
    });

    assert.strictEqual(context.window.location.href, 'https://example.com/en');
});

test('ignores malformed localStorage language value', () => {
    const key = 'https://example.com-language';
    const storage = createStorage({
        [key]: '{invalid-json'
    });

    assert.doesNotThrow(() => runSwitchLanguageScript({
        language: 'en',
        pathname: '/en/',
        storage
    }));
    assert.strictEqual(storage.getItem(key), null);
});

test('does not inject switch-language files when switch-language is disabled', async () => {
    const generator = createGenerator();
    const calls = [];

    generator.createBuildContext = (build, switchSupportTheme) => {
        calls.push(['createBuildContext', build.name, switchSupportTheme]);
        return { ...build, buildDir: `/tmp/${build.name}`, outputDir: `/tmp/${build.name}/${build.generateDir}` };
    };
    generator.runBuildsInParallel = async contexts => contexts;
    generator.mergeLanguageOutputs = () => {};
    generator.cleanupBuildContexts = () => {};
    generator.processSwitchLanguageFile = () => calls.push(['processSwitchLanguageFile']);

    await withLoadYaml(createMultiLanguageConfig(), () => generator.process());

    assert.deepStrictEqual(calls, [
        ['createBuildContext', 'default', null],
        ['createBuildContext', 'en', null],
        ['createBuildContext', 'ja', null]
    ]);
});

test('runs language builds in parallel', async () => {
    const generator = createGenerator();
    const starts = [];

    generator.executeHexoCommands = async workingDir => {
        starts.push({ workingDir, time: Date.now() });
        await delay(60);
    };

    await generator.runBuildsInParallel([
        { name: 'default', buildDir: '/tmp/default' },
        { name: 'en', buildDir: '/tmp/en' },
        { name: 'ja', buildDir: '/tmp/ja' }
    ]);

    assert.strictEqual(starts.length, 3);
    assert.ok(Math.max(...starts.map(item => item.time)) - Math.min(...starts.map(item => item.time)) < 40);
});

runTests();
