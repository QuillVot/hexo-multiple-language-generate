/**
 * 多语言网站生成工具
 * 用于处理 Hexo 博客的多语言版本生成
 * 并行隔离构建实现
 */

const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const {
    readFileSync,
    copyFileSync,
    existsSync,
    unlinkSync,
    mkdirSync,
    readdirSync,
    rmSync,
    lstatSync,
    writeFileSync,
    mkdtempSync,
    symlinkSync
} = require('fs');

// 常量配置
const CONFIG = {
    // 多语言生成目录前缀
    GENERATE_DIR_PREFIX: 'multiple-language-generate-',
    // 语言切换文件名
    SWITCH_LANGUAGE_FILE: 'switch-language.js',
    // 语言切换脚本标签
    SWITCH_LANGUAGE_SCRIPT: '<script defer src="/self/js/switch-language.js"></script>',
    // 配置文件名
    CONFIG_FILE: 'hexo-multiple-language.yml',
    // 临时构建目录前缀
    BUILD_DIR_PREFIX: 'hexo-multiple-language-'
};

/**
 * 文件系统操作工具类
 */
class FileSystemUtils {
    /**
     * 创建目录
     * @param {string} dirPath - 目录路径
     * @param {boolean} [removeExisting=false] - 是否删除已存在的目录
     */
    static createDirectory(dirPath, removeExisting = false) {
        try {
            if (removeExisting && existsSync(dirPath)) {
                rmSync(dirPath, { recursive: true, force: true });
            }
            if (!existsSync(dirPath)) {
                mkdirSync(dirPath, { recursive: true });
            }
        } catch (error) {
            console.error(`创建目录失败: ${dirPath}`, error);
            throw error;
        }
    }

    /**
     * 删除文件或目录
     * @param {string} path - 文件或目录路径
     * @param {boolean} [isDirectory=false] - 是否为目录
     */
    static remove(path, isDirectory = false) {
        try {
            if (!existsSync(path)) return;

            if (isDirectory) {
                rmSync(path, { recursive: true, force: true });
            } else {
                unlinkSync(path);
            }
        } catch (error) {
            console.error(`删除失败: ${path}`, error);
            throw error;
        }
    }

    /**
     * 递归复制目录内容
     * @param {string} source - 源目录路径
     * @param {string} destination - 目标目录路径
     */
    static copyDirectory(source, destination, filter = () => true) {
        try {
            this.createDirectory(destination);

            readdirSync(source).forEach(item => {
                const srcPath = path.join(source, item);
                const destPath = path.join(destination, item);
                if (!filter(srcPath, destPath, item)) return;

                if (lstatSync(srcPath).isDirectory()) {
                    this.copyDirectory(srcPath, destPath, filter);
                } else {
                    copyFileSync(srcPath, destPath);
                }
            });
        } catch (error) {
            console.error(`复制目录失败: ${source} -> ${destination}`, error);
            throw error;
        }
    }

    /**
     * 创建符号链接，目标不存在时静默跳过
     * @param {string} source - 源路径
     * @param {string} destination - 目标路径
     */
    static linkIfExists(source, destination) {
        if (!existsSync(source) || existsSync(destination)) return;
        symlinkSync(source, destination, lstatSync(source).isDirectory() ? 'junction' : 'file');
    }
}

/**
 * YAML 配置文件处理类
 */
class ConfigManager {
    /**
     * 读取并解析 YAML 文件
     * @param {string} filePath - YAML 文件路径
     * @returns {Object} 解析后的配置对象
     */
    static loadYaml(filePath, hexoInstance) {
        try {
            const content = readFileSync(filePath, 'utf8');
            const renderer = hexoInstance || (typeof hexo !== 'undefined' ? hexo : null);
            if (!renderer?.render?.renderSync) {
                throw new Error('缺少 Hexo 渲染器，无法解析 YAML 配置');
            }
            return renderer.render.renderSync({ text: content, engine: 'yaml' });
        } catch (error) {
            console.error(`读取YAML文件失败: ${filePath}`, error);
            throw error;
        }
    }

    /**
     * 更新配置对象中的数组节点
     * @param {Object} config - 配置对象
     * @param {string} path - 节点路径
     * @param {any} newItem - 新项
     */
    static updateArrayNode(config, path, newItem) {
        try {
            const parts = path.split('.');
            let current = config;

            // 建立路径
            for (let i = 0; i < parts.length - 1; i++) {
                current[parts[i]] = current[parts[i]] || {};
                current = current[parts[i]];
            }

            const lastPart = parts[parts.length - 1];
            current[lastPart] = Array.isArray(current[lastPart])
                ? current[lastPart]
                : (current[lastPart] ? [current[lastPart]] : []);

            if (!current[lastPart].includes(newItem)) {
                current[lastPart].push(newItem);
            }
        } catch (error) {
            console.error('更新配置节点失败', error);
            throw error;
        }
    }

    /**
     * 在 YAML 文本中注入 inject.bottom 脚本，尽量保留原有格式与注释
     * @param {string} content - YAML 内容
     * @param {string} script - 需要注入的脚本标签
     * @returns {string} 注入后的 YAML 内容
     */
    static injectBottomScript(content, script) {
        if (content.includes(script)) return content;

        const lines = content.replace(/\r\n/g, '\n').split('\n');
        const quotedScript = `'${script.replace(/'/g, "''")}'`;
        const injectIndex = lines.findIndex(line => /^inject\s*:\s*(?:#.*)?$/.test(line));

        if (injectIndex === -1) {
            const ending = content.endsWith('\n') ? '' : '\n';
            return `${content}${ending}\ninject:\n  bottom:\n    - ${quotedScript}\n`;
        }

        const injectIndent = this.getIndent(lines[injectIndex]);
        const injectEnd = this.findBlockEnd(lines, injectIndex + 1, injectIndent);
        const bottomIndex = lines.findIndex((line, index) => {
            if (index <= injectIndex || index >= injectEnd) return false;
            return this.getIndent(line) > injectIndent && /^\s*bottom\s*:/.test(line);
        });

        if (bottomIndex === -1) {
            lines.splice(injectIndex + 1, 0, `${' '.repeat(injectIndent + 2)}bottom:`, `${' '.repeat(injectIndent + 4)}- ${quotedScript}`);
            return this.joinYamlLines(lines);
        }

        const bottomIndent = this.getIndent(lines[bottomIndex]);
        let bottomEnd = this.findBlockEnd(lines, bottomIndex + 1, bottomIndent);
        while (bottomEnd > bottomIndex + 1 && !lines[bottomEnd - 1].trim()) {
            bottomEnd--;
        }
        lines.splice(bottomEnd, 0, `${' '.repeat(bottomIndent + 2)}- ${quotedScript}`);
        return this.joinYamlLines(lines);
    }

    static getIndent(line) {
        const match = line.match(/^\s*/);
        return match ? match[0].length : 0;
    }

    static findBlockEnd(lines, startIndex, parentIndent) {
        for (let index = startIndex; index < lines.length; index++) {
            const line = lines[index];
            if (!line.trim() || line.trim().startsWith('#')) continue;
            if (this.getIndent(line) <= parentIndent) return index;
        }
        return lines.length;
    }

    static joinYamlLines(lines) {
        const content = lines.join('\n');
        return content.endsWith('\n') ? content : `${content}\n`;
    }
}

/**
 * 多语言生成器类
 */
class MultiLanguageGenerator {
    /**
     * @param {Object} hexo - Hexo 实例
     */
    constructor(hexo) {
        this.hexo = hexo;
        this.baseDir = hexo.base_dir;
    }

    /**
     * 处理语言配置文件
     * @param {string} fileName - 配置文件名
     * @param {boolean} supportTheme - 是否支持主题切换
     * @returns {string} 新配置文件路径
     */
    processConfigFile(fileName, supportTheme, workingDir = this.baseDir) {
        try {
            const sourcePath = path.join(this.baseDir, `${fileName}.yml`);
            const destPath = path.join(workingDir, `_${fileName.replace(/\.[^.]*$/, '')}.yml`);

            FileSystemUtils.remove(destPath);
            copyFileSync(sourcePath, destPath);

            if (supportTheme && fileName.startsWith(supportTheme)) {
                const content = readFileSync(destPath, 'utf8');
                writeFileSync(destPath, ConfigManager.injectBottomScript(content, CONFIG.SWITCH_LANGUAGE_SCRIPT), 'utf8');
            }

            return destPath;
        } catch (error) {
            console.error(`处理配置文件失败: ${fileName}`, error);
            throw error;
        }
    }

    /**
     * 执行 Hexo 清理和生成命令
     * @param {string} workingDir - 独立构建目录
     */
    async executeHexoCommands(workingDir) {
        await this.runHexoCommand(['clean'], workingDir);
        await this.runHexoCommand(['generate'], workingDir);
    }

    /**
     * 执行单个 Hexo 命令
     * @param {string[]} args - Hexo 参数
     * @param {string} workingDir - 工作目录
     */
    runHexoCommand(args, workingDir) {
        const command = this.resolveHexoCommand();

        return new Promise((resolve, reject) => {
            const child = spawn(command, args, {
                cwd: workingDir,
                stdio: 'inherit',
                shell: process.platform === 'win32'
            });

            child.on('error', reject);
            child.on('close', code => {
                if (code === 0) {
                    resolve();
                    return;
                }
                reject(new Error(`Hexo 命令执行失败: ${command} ${args.join(' ')} (exit ${code})`));
            });
        });
    }

    /**
     * 优先使用项目本地 Hexo，避免依赖全局命令
     * @returns {string} Hexo 可执行文件
     */
    resolveHexoCommand() {
        const binName = process.platform === 'win32' ? 'hexo.cmd' : 'hexo';
        const localBin = path.join(this.baseDir, 'node_modules', '.bin', binName);
        if (existsSync(localBin)) return localBin;

        if (process.argv[1] && path.basename(process.argv[1]).startsWith('hexo')) {
            return process.argv[1];
        }

        return 'hexo';
    }

    /**
     * 处理语言切换文件
     * @param {Object} switchConfig - 语言切换配置
     * @param {string} targetDir - 目标目录
     */
    processSwitchLanguageFile(switchConfig, targetDir) {
        try {
            const sourcePath = path.join(__dirname, 'lib/switch-language.js');
            const targetPath = path.join(targetDir, 'self', 'js', CONFIG.SWITCH_LANGUAGE_FILE);

            FileSystemUtils.createDirectory(path.dirname(targetPath));
            copyFileSync(sourcePath, targetPath);

            const content = this.renderSwitchLanguageContent(readFileSync(targetPath, 'utf8'), switchConfig);

            writeFileSync(targetPath, content, 'utf8');
        } catch (error) {
            console.error('处理语言切换文件失败', error);
            throw error;
        }
    }

    /**
     * 将用户配置写入语言切换脚本模板
     * @param {string} content - 原始脚本内容
     * @param {Object} switchConfig - 语言切换配置
     * @returns {string} 渲染后的脚本内容
     */
    renderSwitchLanguageContent(content, switchConfig) {
        const storageTtl = Number.isFinite(Number(switchConfig['storage-ttl']))
            ? Number(switchConfig['storage-ttl'])
            : 60000;
        const defaultLanguage = Array.isArray(switchConfig['default-language'])
            ? switchConfig['default-language']
            : ['zh'];
        const notMatchedLanguage = switchConfig['not-matched-use'] || 'en';
        const supportedLanguages = switchConfig['other-language'] || {};

        const replacements = [
            [/const storage_ttl = \d+;/, `const storage_ttl = ${storageTtl};`],
            [/const defaultLanguage = \[[\s\S]*?\];/, `const defaultLanguage = ${JSON.stringify(defaultLanguage)};`],
            [/const notMatchedLanguage = ['"][\s\S]*?['"];/, `const notMatchedLanguage = ${JSON.stringify(notMatchedLanguage)};`],
            [/const supportedLanguages = \{[\s\S]*?\};/, `const supportedLanguages = ${JSON.stringify(supportedLanguages, null, 4)};`]
        ];

        return replacements.reduce((result, [search, replace]) => result.replace(search, replace), content);
    }

    /**
     * 生成所有需要并行构建的语言上下文
     * @param {Object} multiLangConfig - 插件配置
     * @returns {Array<Object>} 语言构建配置
     */
    createLanguageBuilds(multiLangConfig) {
        const defaultLanguage = multiLangConfig['default-language'];
        if (!defaultLanguage) {
            throw new Error('缺少 default-language 配置');
        }

        const defaultBuild = {
            name: 'default',
            isDefault: true,
            generateDir: defaultLanguage['generate-dir'],
            configFiles: defaultLanguage['config-file-name'] || []
        };

        const otherBuilds = (multiLangConfig['other-language'] || [])
            .filter(lang => lang.enable)
            .map(lang => ({
                name: lang['language-path'],
                isDefault: false,
                languagePath: lang['language-path'],
                generateDir: lang['generate-dir'],
                configFiles: lang['config-file-name'] || []
            }));

        return [defaultBuild, ...otherBuilds];
    }

    /**
     * 为单个语言创建独立构建目录
     * @param {Object} build - 语言构建配置
     * @param {string|null} switchSupportTheme - 需要注入的主题配置名前缀
     * @param {string[]} outputDirs - 所有输出目录
     * @returns {Object} 构建上下文
     */
    createBuildContext(build, switchSupportTheme, outputDirs) {
        const buildDir = mkdtempSync(path.join(os.tmpdir(), CONFIG.BUILD_DIR_PREFIX));
        this.copyProjectToBuildDir(buildDir, outputDirs);

        build.configFiles.forEach(configFile => {
            this.processConfigFile(configFile, switchSupportTheme, buildDir);
        });

        return {
            ...build,
            buildDir,
            outputDir: path.join(buildDir, build.generateDir)
        };
    }

    /**
     * 复制项目到临时构建目录，跳过会造成冲突或体积过大的路径
     * @param {string} buildDir - 临时构建目录
     * @param {string[]} outputDirs - 需要跳过的输出目录
     */
    copyProjectToBuildDir(buildDir, outputDirs) {
        const skippedNames = new Set(['.git', 'node_modules', 'coverage', '.DS_Store']);
        const skippedOutputDirs = outputDirs
            .filter(Boolean)
            .map(outputDir => path.normalize(outputDir));

        FileSystemUtils.copyDirectory(this.baseDir, buildDir, sourcePath => {
            const relativePath = path.relative(this.baseDir, sourcePath);
            if (!relativePath) return true;

            const firstSegment = relativePath.split(path.sep)[0];
            if (skippedNames.has(firstSegment)) return false;
            if (skippedOutputDirs.some(outputDir => relativePath === outputDir || relativePath.startsWith(`${outputDir}${path.sep}`))) {
                return false;
            }
            if (firstSegment.startsWith(CONFIG.GENERATE_DIR_PREFIX)) return false;
            return true;
        });

        FileSystemUtils.linkIfExists(path.join(this.baseDir, 'node_modules'), path.join(buildDir, 'node_modules'));
    }

    /**
     * 并行执行所有语言构建
     * @param {Object[]} contexts - 构建上下文
     * @returns {Promise<Object[]>} 构建结果
     */
    runBuildsInParallel(contexts) {
        const tasks = contexts.map(async context => {
            console.log(`开始构建语言: ${context.name}`);
            await this.executeHexoCommands(context.buildDir);
            console.log(`完成构建语言: ${context.name}`);
            return context;
        });

        return Promise.allSettled(tasks).then(results => {
            const failures = results.filter(result => result.status === 'rejected');
            if (failures.length > 0) {
                throw new Error(failures.map(result => result.reason.message).join('\n'));
            }
            return results.map(result => result.value);
        });
    }

    /**
     * 合并所有语言输出
     * @param {Object[]} contexts - 构建上下文
     * @param {string} defaultGenDir - 默认语言输出目录
     */
    mergeLanguageOutputs(contexts, defaultGenDir) {
        const defaultContext = contexts.find(context => context.isDefault);
        if (!defaultContext || !existsSync(defaultContext.outputDir)) {
            throw new Error(`默认语言输出目录不存在: ${defaultContext?.outputDir || defaultGenDir}`);
        }

        const finalOutputDir = path.join(this.baseDir, defaultGenDir);
        FileSystemUtils.createDirectory(finalOutputDir, true);
        FileSystemUtils.copyDirectory(defaultContext.outputDir, finalOutputDir);

        contexts
            .filter(context => !context.isDefault)
            .forEach(context => {
                if (!existsSync(context.outputDir)) {
                    throw new Error(`语言 ${context.name} 输出目录不存在: ${context.outputDir}`);
                }
                const targetPath = path.join(finalOutputDir, context.languagePath);
                FileSystemUtils.createDirectory(targetPath, true);
                FileSystemUtils.copyDirectory(context.outputDir, targetPath);
            });
    }

    /**
     * 清理所有临时构建目录
     * @param {Object[]} contexts - 构建上下文
     */
    cleanupBuildContexts(contexts) {
        contexts.forEach(context => {
            if (context.buildDir) {
                FileSystemUtils.remove(context.buildDir, true);
            }
        });
    }

    /**
     * 主要处理流程
     */
    async process() {
        const contexts = [];

        try {
            console.log('开始处理多语言并行生成...');

            const config = ConfigManager.loadYaml(path.join(this.baseDir, CONFIG.CONFIG_FILE), this.hexo);
            const multiLangConfig = config['hexo-multiple-language'];

            if (!multiLangConfig) {
                console.log('未找到多语言配置，处理终止');
                return;
            }

            const switchConfig = multiLangConfig['switch-language'];
            const switchSupportTheme = switchConfig?.enable ? switchConfig?.['support-theme'] : null;
            const builds = this.createLanguageBuilds(multiLangConfig);
            const outputDirs = builds.map(build => build.generateDir);

            builds.forEach(build => {
                contexts.push(this.createBuildContext(build, switchSupportTheme, outputDirs));
            });

            await this.runBuildsInParallel(contexts);

            const defaultGenDir = builds.find(build => build.isDefault).generateDir;
            this.mergeLanguageOutputs(contexts, defaultGenDir);

            if (switchSupportTheme) {
                console.log('设置语言切换功能...');
                contexts
                    .filter(context => !context.isDefault)
                    .forEach(context => {
                        const targetDir = path.join(this.baseDir, defaultGenDir, context.languagePath);
                        this.processSwitchLanguageFile(switchConfig, targetDir);
                    });

                this.processSwitchLanguageFile(switchConfig, path.join(this.baseDir, defaultGenDir));
            }

            console.log('多语言并行生成处理完成');
        } catch (error) {
            console.error('多语言生成处理失败:', error);
            throw error;
        } finally {
            this.cleanupBuildContexts(contexts);
        }
    }
}

// 注册 Hexo 命令
if (typeof hexo !== 'undefined' && hexo.extend?.console) {
    hexo.extend.console.register('multiple-language-generate', '并行生成多语言版本', {}, async function() {
        try {
            const generator = new MultiLanguageGenerator(hexo);
            await generator.process();
        } catch (error) {
            console.error('执行多语言生成命令失败:', error);
            process.exit(1);
        }
    });
}

module.exports = {
    CONFIG,
    ConfigManager,
    FileSystemUtils,
    MultiLanguageGenerator
};
