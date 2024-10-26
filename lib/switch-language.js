/**
 * 多语言切换模块
 * 用于处理网站的多语言切换、重定向和语言持久化功能
 */

// --------------- 语言配置区域 ---------------
/**
 * 网站默认使用的语言列表
 * @type {string[]} 默认语言代码数组
 */
const defaultLanguage = ['zh'];

/**
 * 当访问者的语言与支持的语言不匹配时使用的默认语言
 * @type {string} 默认回退语言代码
 */
const notMatchedLanguage = 'en';

/**
 * 网站支持的其他语言配置
 * 键为语言路径，值为该语言支持的变体数组
 * @type {Object.<string, string[]>}
 */
const supportedLanguages = {
    "en": ["en"],      // 英语
    "ja": ["ja"]       // 日语
};

// --------------- 缓存配置区域 ---------------
/**
 * 语言选择的缓存时间（毫秒）
 * @type {number}
 */
const storage_ttl = 60000; // 1分钟

// --------------- 页面信息获取区域 ---------------
/**
 * 获取当前环境的基本信息
 */
const browserLanguage = navigator.language || navigator.userLanguage;    // 浏览器语言
const pageHost = window.location.host;                                  // 当前域名
const pageProtocol = window.location.protocol;                         // 当前协议
const pagePathName = window.location.pathname;                         // 当前路径
const currentLanguagePath = pagePathName.split('/')[1];                // 当前语言路径
const localStorageLanguage = `${pageProtocol}//${pageHost}-language`;  // 存储键名

/**
 * 语言切换链接处理
 * 为所有带有语言切换标记的链接添加点击事件监听
 */
function initLanguageSwitchLinks() {
    document.querySelectorAll('a[href]').forEach(link => {
        if (link.firstElementChild?.classList.contains('multiple-language-switch')) {
            const languageType = link.href.split('/').pop();

            link.addEventListener('click', function(event) {
                event.preventDefault();
                handleLanguageSwitch(languageType);
            });
        }
    });
}

/**
 * 处理语言切换逻辑
 * @param {string} languageType - 目标语言代码
 */
function handleLanguageSwitch(languageType) {
    // 保存语言选择到本地存储
    setItemWithExpiry(localStorageLanguage, languageType, storage_ttl);

    // 构建新的URL
    const hostUrl = `${pageProtocol}//${pageHost}`;
    const subPagePathName = getSubPagePath();

    // 根据是否为默认语言决定跳转路径
    if (defaultLanguage.includes(languageType)) {
        window.location.href = `${hostUrl}${subPagePathName}`;
    } else {
        window.location.href = `${hostUrl}/${languageType}${subPagePathName}`;
    }
}

/**
 * 获取子页面路径
 * @returns {string} 处理后的子页面路径
 */
function getSubPagePath() {
    // 如果路径为空,直接返回空字符串
    if (!pagePathName) {
        return '';
    }
    // 标准化路径末尾的斜杠
    const normalizedPath = pagePathName.endsWith('/') ? pagePathName : pagePathName + '/';
    // 处理语言路径
    const processedPath = currentLanguagePath in supportedLanguages
        ? normalizedPath.replace(`/${currentLanguagePath}/`, '/')
        : normalizedPath;
    // 如果处理后的路径为根路径,返回空字符串
    if (processedPath === '/') {
        return '';
    }
    // 格式化最终路径
    return '/' + processedPath.replace(/^\/+/, '');
}

/**
 * 检查并重定向到合适的语言页面
 * 根据用户浏览器语言和已保存的语言选择进行适当的重定向
 */
function checkAndRedirectLanguage() {
    // 检查是否为子页面，是则不进行重定向
    if ((pagePathName.split('/').filter(item => item !== '').length +
        (!(currentLanguagePath in supportedLanguages) ? 1 : 0)) > 1) {
        return;
    }

    // 检查本地存储中的语言选择
    const savedLanguage = getItemWithExpiry(localStorageLanguage);
    if (handleSavedLanguageRedirect(savedLanguage)) return;

    // 处理浏览器语言匹配
    handleBrowserLanguageRedirect();
}

/**
 * 处理保存的语言重定向
 * @param {string|null} savedLanguage - 保存的语言代码
 * @returns {boolean} 是否已处理重定向
 */
function handleSavedLanguageRedirect(savedLanguage) {
    if (!savedLanguage) return false;

    if (defaultLanguage.includes(savedLanguage) && currentLanguagePath) {
        window.location.href = `${pageProtocol}//${pageHost}`;
        return true;
    }

    if (savedLanguage in supportedLanguages && savedLanguage != currentLanguagePath) {
        window.location.href = `${pageProtocol}//${pageHost}/${savedLanguage}`;
        return true;
    }

    return false;
}

/**
 * 处理浏览器语言重定向
 */
function handleBrowserLanguageRedirect() {
    if (browserLanguage === currentLanguagePath) return;

    const supportedLanguage = getSupportedLanguage(supportedLanguages, browserLanguage);

    if (defaultLanguage.includes(browserLanguage)) {
        if (currentLanguagePath in supportedLanguages) {
            window.location.href = `${pageProtocol}//${pageHost}`;
        }
    } else if (supportedLanguage && !supportedLanguage.includes(currentLanguagePath)) {
        window.location.href = `${pageProtocol}//${pageHost}/${supportedLanguage[0]}`;
    } else if (!browserLanguage in supportedLanguages && currentLanguagePath !== notMatchedLanguage) {
        window.location.href = `${pageProtocol}//${pageHost}/${notMatchedLanguage}`;
    }
}

/**
 * 获取支持的语言匹配
 * @param {Object} supportedLanguages - 支持的语言配置对象
 * @param {string} browserLanguage - 浏览器语言代码
 * @returns {string[]|null} 匹配的语言配置或null
 */
function getSupportedLanguage(supportedLanguages, browserLanguage) {
    for (const [key, languages] of Object.entries(supportedLanguages)) {
        if (languages.includes(browserLanguage)) {
            return [key, browserLanguage];
        }
    }
    return null;
}

/**
 * 带过期时间的本地存储设置
 * @param {string} key - 存储键名
 * @param {*} value - 存储值
 * @param {number} ttl - 过期时间（毫秒）
 */
function setItemWithExpiry(key, value, ttl) {
    const item = {
        value: value,
        expiry: Date.now() + ttl
    };
    localStorage.setItem(key, JSON.stringify(item));
}

/**
 * 获取本地存储的值（考虑过期时间）
 * @param {string} key - 存储键名
 * @returns {*|null} 存储的值或null（如果已过期）
 */
function getItemWithExpiry(key) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    const item = JSON.parse(itemStr);
    if (Date.now() > item.expiry) {
        localStorage.removeItem(key);
        return null;
    }
    return item.value;
}

// 初始化执行
initLanguageSwitchLinks();
checkAndRedirectLanguage();
