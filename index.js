const {execSync} = require('child_process');
const path = require('path');
const {
    readFileSync, copyFileSync, existsSync, unlinkSync, mkdirSync, readdirSync, rmSync, lstatSync, writeFileSync
} = require('fs');
//自定义标记
const multiple_language_generate_dir = 'multiple-language-generate-';
// 自定义js文件
const switch_language_file_name = 'switch-language.js';
// 添加的yml文件路径
const switch_language_file_bottom = '<script defer src="/self/js/' + switch_language_file_name + '"></script>';
//监听generate方法并处理自定义逻辑
hexo.extend.console.register('multiple-language-generate', 'Custom generate command', {}, () => {
    // 读取并解析 YAML 文件
    try {
        // 使用 Hexo 的内置方法解析 YAML 文件内容
        const config_yml = syncLoadAndRenderYaml(path.join(hexo.base_dir, 'hexo-multiple-language.yml'));
        const hexo_multiple_language = config_yml['hexo-multiple-language'];
        let other_language_generate_dir = [];
        if (hexo_multiple_language) {
            // 语言切换开关
            const switch_language = hexo_multiple_language['switch-language'];
            const switch_support_theme = switch_language && switch_language['enable'] && switch_language['support-theme'];
            const switch_storage_ttl = switch_language && switch_language['storage-ttl']; //有效时间
            const switch_default_language = switch_language && switch_language['default-language']; //有效时间
            const switch_not_matched_use = switch_language && switch_language['not-matched-use']; //未匹配后的默认值
            const switch_other_language = switch_language && switch_language['other-language']; //语言与浏览器配置
            //1 other-language 构建
            const other_language = hexo_multiple_language['other-language'];
            if (other_language) {
                other_language.forEach(item => {
                    if (item.enable) {
                        const config_file_name = item["config-file-name"];
                        const generate_dir = item["generate-dir"];
                        const language_path = item["language-path"];
                        //生成配置文件
                        config_file_name.forEach(fileNameItem => {
                            const new_file_path = cpoyAndGenerateNewFile(fileNameItem);
                            //对新配置文件做更新
                            if (fileNameItem.startsWith(switch_support_theme)) {
                                const new_file_path_yml = syncLoadAndRenderYaml(new_file_path);
                                addLanguageSwitchFile(new_file_path, new_file_path_yml)
                            }
                        });
                        //构建
                        execSyncCleanAndGenerate();
                        const bak_generate_dir = `${multiple_language_generate_dir}${generate_dir}`;
                        createBakPublic(generate_dir, bak_generate_dir);//备份
                        other_language_generate_dir.push({
                            language_path: language_path, bak_generate_dir: bak_generate_dir
                        });
                    }
                });
            }
            // 2 default-language 构建
            const default_language = hexo_multiple_language['default-language'];
            let default_language_generate_dir;
            if (default_language) {
                const config_file_name = default_language["config-file-name"];
                default_language_generate_dir = default_language['generate-dir'];
                //生成配置文件
                config_file_name.forEach(fileNameItem => {
                    const new_file_path = cpoyAndGenerateNewFile(fileNameItem);
                    //对新配置文件做更新
                    if (fileNameItem.startsWith(switch_support_theme)) {
                        const new_file_path_yml = syncLoadAndRenderYaml(new_file_path);
                        addLanguageSwitchFile(new_file_path, new_file_path_yml)
                    }
                });
                //构建
                execSyncCleanAndGenerate();
            }
            // 3.1 other-language 复制文件
            if (other_language_generate_dir && default_language_generate_dir) {
                //3.1 复制构建文件
                other_language_generate_dir.forEach(item => {
                    const {language_path, bak_generate_dir} = item;
                    const sourceFolder = path.join(hexo.base_dir, `${bak_generate_dir}`); // 源文件夹路径
                    const targetFolder = path.join(hexo.base_dir, `${default_language_generate_dir}/${language_path}`); // 目标文件夹路径
                    createDirBeforRemove(targetFolder); // 创建目标文件夹
                    copyFolderContentsSync(sourceFolder, targetFolder); // 复制文件夹内容
                    removeFileDir(sourceFolder); // 删除源文件夹
                })
            }
            // 3.2 复制语言切换文件
            if (switch_support_theme) {
                const sourceFilePath = path.join(__dirname, 'lib/switch-language.js');
                other_language_generate_dir.forEach(item => {
                    const {language_path, bak_generate_dir} = item;
                    const other_switch_language_file_path = `${hexo.base_dir}/${default_language_generate_dir}/${language_path}/self/js/`;
                    createDir(other_switch_language_file_path);
                    const destinationFilePath = path.join(other_switch_language_file_path, `${switch_language_file_name}`); // 目标配置文件路径
                    copyFileSync(sourceFilePath, destinationFilePath);//复制文件
                    //替换内容
                    let content = readFileSync(destinationFilePath, 'utf8');
                    // 使用正则替换函数
                    content = content.replace('const storage_ttl = 60000;', `const storage_ttl = ${switch_storage_ttl};`);
                    content = content.replace('const defaultLanguage = [\'zh\'];', `const defaultLanguage = ${JSON.stringify(switch_default_language)};`);
                    content = content.replace('const notMatchedLanguage = \'en\';', `const notMatchedLanguage = \'${switch_not_matched_use}\';`);
                    content = content.replace('const supportedLanguages = {"en": ["en"], "ja": ["ja", "en-CA"]};', `const supportedLanguages = ${JSON.stringify(switch_other_language)} ;`);
                    writeFileSync(destinationFilePath, content, 'utf8');
                })
                var default_switch_language_file_path = `${hexo.base_dir}/${default_language_generate_dir}/self/js/`;
                createDir(default_switch_language_file_path);
                const destinationFilePath = path.join(default_switch_language_file_path, `${switch_language_file_name}`); // 目标配置文件路径
                copyFileSync(sourceFilePath, destinationFilePath);//复制文件
                //替换内容
                let content = readFileSync(destinationFilePath, 'utf8');
                // 使用正则替换函数
                content = content.replace('const storage_ttl = 60000;', `const storage_ttl = ${switch_storage_ttl};`);
                content = content.replace('const defaultLanguage = [\'zh\'];', `const defaultLanguage = ${JSON.stringify(switch_default_language)};`);
                content = content.replace('const notMatchedLanguage = \'en\';', `const notMatchedLanguage = \'${switch_not_matched_use}\';`);
                content = content.replace('const supportedLanguages = {"en": ["en"], "ja": ["ja", "en-CA"]};', `const supportedLanguages = ${JSON.stringify(switch_other_language)} ;`);
                writeFileSync(destinationFilePath, content, 'utf8');
            }
        }
        // 可以在这里使用解析后的数据
    } catch (error) {
        console.error('Error reading or parsing YAML file:', error);
    }
});

/**
 * 创建文件夹
 * @param {string} folderPath - 文件夹路径
 */
function createDir(folderPath) {
    if (!existsSync(folderPath)) { // 检查文件夹是否存在
        mkdirSync(folderPath); // 创建新的文件夹
    }
}

/**
 * 创建文件夹
 * @param {string} folderPath - 文件夹路径
 */
function createDirBeforRemove(folderPath) {
    if (existsSync(folderPath)) { // 检查文件夹是否存在
        rmSync(folderPath, {recursive: true, force: true}); // 删除已存在的文件夹
    }
    mkdirSync(folderPath); // 创建新的文件夹
}

/**
 * 删除指定的文件夹及其内容
 * @param {string} filePath - 文件夹路径
 */
function removeFileDir(filePath) {
    if (existsSync(filePath)) { // 检查文件夹是否存在
        rmSync(filePath, {recursive: true, force: true}); // 删除文件夹及其内容
    }
}

/**
 * 删除指定的文件
 * @param {string} filePath - 文件路径
 */
function removeFile(filePath) {
    if (existsSync(filePath)) { // 检查文件是否存在
        unlinkSync(filePath, {recursive: true, force: true}); // 删除文件
    }
}

/**
 * 复制出新的配置文件
 * @param fileNameItem
 */
function cpoyAndGenerateNewFile(fileNameItem) {
    // 复制配置文件
    const sourceFilePath = path.join(hexo.base_dir, `${fileNameItem}.yml`); // 源配置文件路径
    const destinationFilePath = path.join(hexo.base_dir, `_${fileNameItem.replace(/\.[^.]*$/, '')}.yml`); // 目标配置文件路径
    removeFile(destinationFilePath); //删除原有文件
    copyFileSync(sourceFilePath, destinationFilePath);//复制文件
    return destinationFilePath;
}

/**
 * 复制文件夹内容的函数
 * @param {string} src - 源文件夹路径
 * @param {string} dest - 目标文件夹路径
 */
function copyFolderContentsSync(src, dest) {
    const items = readdirSync(src); // 读取源文件夹的内容
    items.forEach(item => {
        const srcPath = path.join(src, item); // 源文件的完整路径
        const destPath = path.join(dest, item); // 目标文件的完整路径
        if (lstatSync(srcPath).isDirectory()) { // 检查是否为文件夹
            mkdirSync(destPath, {recursive: true}); // 创建目标子文件夹
            copyFolderContentsSync(srcPath, destPath); // 递归复制内容
        } else {
            copyFileSync(srcPath, destPath); // 复制文件
        }
    });
}

/**
 * 创建备份
 * @param item
 */
function createBakPublic(generate_dir, bak_generate_dir) {
    const sourceFolder = path.join(hexo.base_dir, generate_dir); // 源文件夹路径
    const targetFolder = path.join(hexo.base_dir, bak_generate_dir); // 目标文件夹路径
    createDirBeforRemove(targetFolder); // 创建目标文件夹
    copyFolderContentsSync(sourceFolder, targetFolder); // 复制文件夹内容
    removeFileDir(sourceFolder); // 删除源文件夹
}

/**
 * 构建输出文件
 */
function execSyncCleanAndGenerate() {
    execSync('hexo clean', {stdio: 'inherit'}); // 清理缓存和数据库
    execSync(`hexo generate`, {stdio: 'inherit'}); // 执行 hexo 生成命令
}


/**
 * 读取文件
 * @param filePath
 * @returns {any}
 */
function syncLoadAndRenderYaml(filePath) {
    // 读取文件内容
    const fileContent = readFileSync(filePath, 'utf8');
    // 使用 Hexo 的内置方法解析 YAML 文件内容
    return hexo.render.renderSync({text: fileContent, engine: 'yaml'});
}

/**
 * 写文件
 * @param new_file_path
 * @param new_file_path_yml
 */
function addLanguageSwitchFile(new_file_path, new_file_path_yml) {
    addToArrayNode(new_file_path_yml, 'inject.bottom', switch_language_file_bottom)
    // 直接写入文件覆盖原内容
    removeFile(new_file_path);
    writeFileSync(new_file_path, JSON.stringify(new_file_path_yml, null, 2), 'utf8');
}


// 1. 检查并添加基本节点
function addDataToNode(obj, path, newData) {
    // 将路径拆分为数组，如 'database.settings.timeout' => ['database', 'settings', 'timeout']
    const parts = path.split('.');
    let current = obj;

    // 遍历路径，确保每一级节点都存在
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        // 如果节点不存在，创建空对象
        if (!current[part]) {
            current[part] = {};
        }
        // 如果节点不是对象类型，转换为对象
        else if (typeof current[part] !== 'object') {
            current[part] = {};
        }
        current = current[part];
    }

    // 设置最终节点的值
    const lastPart = parts[parts.length - 1];
    current[lastPart] = newData;
}

// 2. 检查并添加数组节点
function addToArrayNode(obj, path, newItem) {
    const parts = path.split('.');
    let current = obj;

    // 遍历到最后一个节点的父节点
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
            current[part] = {};
        }
        current = current[part];
    }

    // 处理最后一个节点
    const lastPart = parts[parts.length - 1];
    if (!current[lastPart]) {
        // 如果节点不存在，创建数组
        current[lastPart] = [];
    } else if (!Array.isArray(current[lastPart])) {
        // 如果节点存在但不是数组，转换为数组并保留原值
        current[lastPart] = [current[lastPart]];
    }

    // 添加新项到数组
    if (!current[lastPart].includes(newItem)) {
        current[lastPart].push(newItem);
    }
}
