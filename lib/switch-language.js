// 默认首页使用的语言
const defaultLanguage = ['zh'];
// 未匹配到语言使用的默认语言路径
const notMatchedLanguage = 'en';
// 除默认语言外支持的语言
const supportedLanguages = {"en": ["en"], "ja": ["ja"]};

//默认缓存时间
const storage_ttl = 60000;

// 获取浏览器的语言（包含地区代码）
const browserLanguage = navigator.language || navigator.userLanguage;
// 获取当前页面的主机名
const pageHost = window.location.host;
// 获取当前页面的协议（http 或 https）
const pageProtocol = window.location.protocol;
// 获取当前页面的路径名
const pagePathName = window.location.pathname;
// 获取当前路径中的语言部分（假设路径格式为 /语言/其他内容）
const currentLanguagePath = pagePathName.split('/')[1];
//当前缓存语言类型
const localStorageLanguage = `${pageProtocol}//${pageHost}-language`;


document.querySelectorAll('a[href]').forEach(link => {
    if (link.firstElementChild && link.firstElementChild.classList.contains('multiple-language-switch')) {
        const languageType = link.href.split('/')[link.href.split('/').length - 1]
        console.log(link);
        link.addEventListener('click', function (event) {
            debugger;
            event.preventDefault(); // 阻止有特定 class 的链接跳转
            setItemWithExpiry(localStorageLanguage, languageType, storage_ttl);
            console.log('阻止了跳转');
            //需要跳转的子页面
            var replaceSubPagePathName = (!(currentLanguagePath in supportedLanguages) ? pagePathName : pagePathName.replaceAll(`/${currentLanguagePath}/`, ''));
            let subPagePathName = ((replaceSubPagePathName && '/' !== replaceSubPagePathName) ? '/' + replaceSubPagePathName.replace(/^\/+/, '') : '');
            //存在默认则走默认值
            var hostUrl = `${pageProtocol}//${pageHost}`;
            if (defaultLanguage.includes(languageType)) {
                window.location.href = `${hostUrl}${subPagePathName}`;
            } else {
                window.location.href = `${hostUrl}/${languageType}${subPagePathName}`;
            }
        });
    }
});


/**
 * 检查并跳转到合适的语言路径
 * @param {string} browserLanguage - 浏览器的语言
 * @param {string} currentLanguagePath - 当前页面路径中的语言部分
 */
function checkAndRedirectLanguage() {
    //如果指定页面url则不进行切换
    if ((pagePathName.split('/').filter(item => item !== '').length + (!(currentLanguagePath in supportedLanguages) ? 1 : 0)) > 1) {
        return;
    }
    //存在手动设置则使用手动设置
    const itemWithExpiry = getItemWithExpiry(localStorageLanguage);
    if (itemWithExpiry) {
        //存在默认则走默认值
        if (defaultLanguage.includes(itemWithExpiry) && currentLanguagePath) {
            window.location.href = `${pageProtocol}//${pageHost}`;
        } else if (itemWithExpiry in supportedLanguages && itemWithExpiry != currentLanguagePath) {
            window.location.href = `${pageProtocol}//${pageHost}/${itemWithExpiry}`;
        }
        return;
    }
    // 检查当前页面路径中的语言与浏览器语言是否匹配
    if (browserLanguage !== currentLanguagePath) {
        const supportedLanguage = getSupportedLanguage(supportedLanguages, browserLanguage)
        // 如果浏览器语言为中文且路径不为空，则跳转到主路径
        if (defaultLanguage.includes(browserLanguage)) {
            if (currentLanguagePath in supportedLanguages) {
                window.location.href = `${pageProtocol}//${pageHost}`;
            }
        }
        // 如果浏览器语言在支持的语言数组中，且路径中的语言与浏览器语言不一致，则跳转到对应语言路径
        else if (supportedLanguage && !supportedLanguage.includes(currentLanguagePath)) {
            window.location.href = `${pageProtocol}//${pageHost}/${supportedLanguage[0]}`;
        }
        // 如果浏览器语言不在支持的语言数组中，且当前路径不是英文路径，则跳转到英文路径
        else if (!browserLanguage in supportedLanguages && currentLanguagePath !== notMatchedLanguage) {
            window.location.href = `${pageProtocol}//${pageHost}/${notMatchedLanguage}`;
        }
    }
}

/**
 * 获取支持语言
 * @param supportedLanguages
 * @param browserLanguage
 */
function getSupportedLanguage(supportedLanguages, browserLanguage) {
    // 获取 supportedLanguages 对象的键
    var keys = Object.keys(supportedLanguages);
    // 遍历所有的键
    for (let key of keys) {
        // 遍历每个键对应的语言数组
        for (let language of supportedLanguages[key]) {
            // 检查是否匹配浏览器语言
            if (language === browserLanguage) {
                return [key, browserLanguage];
            }
        }
    }
    // 如果没有找到匹配的语言，返回一个默认值或空值
    return null;
}


/**
 * 设置数据并添加过期时间
 * @param key
 * @param value
 * @param ttl
 */
function setItemWithExpiry(key, value, ttl) {
    const expiry = Date.now() + ttl;
    localStorage.setItem(key, JSON.stringify({value, expiry}));
}

/**
 * 读取数据并检查是否过期
 * @param key
 * @returns {*|null}
 */
function getItemWithExpiry(key) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    const {value, expiry} = JSON.parse(itemStr);
    if (Date.now() > expiry) {
        localStorage.removeItem(key);
        return null;
    }
    return value;
}

checkAndRedirectLanguage();
