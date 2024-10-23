/**
 * 多语言网站生成工具
 * 用于处理 Hexo 博客的多语言版本生成
 * 同步版本实现
 */

const { execSync } = require('child_process');
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
    writeFileSync
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
    CONFIG_FILE: 'hexo-multiple-language.yml'
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
    static copyDirectory(source, destination) {
        try {
            this.createDirectory(destination);

            readdirSync(source).forEach(item => {
                const srcPath = path.join(source, item);
                const destPath = path.join(destination, item);

                if (lstatSync(srcPath).isDirectory()) {
                    this.copyDirectory(srcPath, destPath);
                } else {
                    copyFileSync(srcPath, destPath);
                }
            });
        } catch (error) {
            console.error(`复制目录失败: ${source} -> ${destination}`, error);
            throw error;
        }
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
    static loadYaml(filePath) {
        try {
            const content = readFileSync(filePath, 'utf8');
            return hexo.render.renderSync({ text: content, engine: 'yaml' });
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
    processConfigFile(fileName, supportTheme) {
        try {
            const sourcePath = path.join(this.baseDir, `${fileName}.yml`);
            const destPath = path.join(this.baseDir, `_${fileName.replace(/\.[^.]*$/, '')}.yml`);

            FileSystemUtils.remove(destPath);
            copyFileSync(sourcePath, destPath);

            if (supportTheme && fileName.startsWith(supportTheme)) {
                const config = ConfigManager.loadYaml(destPath);
                ConfigManager.updateArrayNode(config, 'inject.bottom', CONFIG.SWITCH_LANGUAGE_SCRIPT);

                FileSystemUtils.remove(destPath);
                writeFileSync(destPath, JSON.stringify(config, null, 2), 'utf8');
            }

            return destPath;
        } catch (error) {
            console.error(`处理配置文件失败: ${fileName}`, error);
            throw error;
        }
    }

    /**
     * 执行 Hexo 清理和生成命令
     */
    executeHexoCommands() {
        try {
            execSync('hexo clean', { stdio: 'inherit' });
            execSync('hexo generate', { stdio: 'inherit' });
        } catch (error) {
            console.error('执行Hexo命令失败', error);
            throw error;
        }
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

            let content = readFileSync(targetPath, 'utf8');

            // 替换配置内容
            const replacements = {
                'const storage_ttl = 60000;': `const storage_ttl = ${switchConfig['storage-ttl']};`,
                'const defaultLanguage = [\'zh\'];': `const defaultLanguage = ${JSON.stringify(switchConfig['default-language'])};`,
                'const notMatchedLanguage = \'en\';': `const notMatchedLanguage = '${switchConfig['not-matched-use']}';`,
                'const supportedLanguages = {"en": ["en"], "ja": ["ja", "en-CA"]};':
                    `const supportedLanguages = ${JSON.stringify(switchConfig['other-language'])};`
            };

            Object.entries(replacements).forEach(([search, replace]) => {
                content = content.replace(search, replace);
            });

            writeFileSync(targetPath, content, 'utf8');
        } catch (error) {
            console.error('处理语言切换文件失败', error);
            throw error;
        }
    }

    /**
     * 备份生成的文件
     * @param {string} sourceDir - 源目录
     * @param {string} backupDir - 备份目录
     */
    backupPublic(sourceDir, backupDir) {
        try {
            const sourcePath = path.join(this.baseDir, sourceDir);
            const backupPath = path.join(this.baseDir, backupDir);

            FileSystemUtils.createDirectory(backupPath, true);
            FileSystemUtils.copyDirectory(sourcePath, backupPath);
            FileSystemUtils.remove(sourcePath, true);
        } catch (error) {
            console.error('备份文件失败', error);
            throw error;
        }
    }

    /**
     * 合并语言版本
     * @param {Array} processedDirs - 已处理的目录列表
     * @param {string} defaultGenDir - 默认生成目录
     */
    mergeLanguageVersions(processedDirs, defaultGenDir) {
        try {
            processedDirs.forEach(({ languagePath, bakDir }) => {
                const sourcePath = path.join(this.baseDir, bakDir);
                const targetPath = path.join(this.baseDir, `${defaultGenDir}/${languagePath}`);

                FileSystemUtils.createDirectory(targetPath, true);
                FileSystemUtils.copyDirectory(sourcePath, targetPath);
                FileSystemUtils.remove(sourcePath, true);
            });
        } catch (error) {
            console.error('合并语言版本失败', error);
            throw error;
        }
    }

    /**
     * 主要处理流程
     */
    process() {
        try {
            console.log('开始处理多语言生成...');

            // 加载配置
            const config = ConfigManager.loadYaml(path.join(this.baseDir, CONFIG.CONFIG_FILE));
            const multiLangConfig = config['hexo-multiple-language'];

            if (!multiLangConfig) {
                console.log('未找到多语言配置，处理终止');
                return;
            }

            const switchConfig = multiLangConfig['switch-language'];
            const otherLanguages = multiLangConfig['other-language'] || [];
            const defaultLanguage = multiLangConfig['default-language'];

            // 处理其他语言
            console.log('处理其他语言配置...');
            const processedDirs = [];
            otherLanguages.forEach(lang => {
                if (!lang.enable) return;

                // 处理配置文件
                lang['config-file-name'].forEach(configFile => {
                    this.processConfigFile(configFile, switchConfig?.['support-theme']);
                });

                // 生成并备份
                this.executeHexoCommands();
                const bakDir = `${CONFIG.GENERATE_DIR_PREFIX}${lang['generate-dir']}`;
                this.backupPublic(lang['generate-dir'], bakDir);

                processedDirs.push({
                    languagePath: lang['language-path'],
                    bakDir: bakDir
                });
            });

            // 处理默认语言
            if (defaultLanguage) {
                console.log('处理默认语言配置...');
                const defaultGenDir = defaultLanguage['generate-dir'];

                defaultLanguage['config-file-name'].forEach(configFile => {
                    this.processConfigFile(configFile, switchConfig?.['support-theme']);
                });

                this.executeHexoCommands();

                // 合并所有语言版本
                this.mergeLanguageVersions(processedDirs, defaultGenDir);

                // 处理语言切换文件
                if (switchConfig?.['support-theme']) {
                    console.log('设置语言切换功能...');
                    // 处理其他语言的切换文件
                    processedDirs.forEach(({ languagePath }) => {
                        const targetDir = path.join(this.baseDir, defaultGenDir, languagePath);
                        this.processSwitchLanguageFile(switchConfig, targetDir);
                    });

                    // 处理默认语言的切换文件
                    const defaultTargetDir = path.join(this.baseDir, defaultGenDir);
                    this.processSwitchLanguageFile(switchConfig, defaultTargetDir);
                }
            }

            console.log('多语言生成处理完成');
        } catch (error) {
            console.error('多语言生成处理失败:', error);
            throw error;
        }
    }
}

// 注册 Hexo 命令
hexo.extend.console.register('multiple-language-generate', '生成多语言版本', {}, function() {
    try {
        const generator = new MultiLanguageGenerator(hexo);
        generator.process();
    } catch (error) {
        console.error('执行多语言生成命令失败:', error);
        process.exit(1);
    }
});
