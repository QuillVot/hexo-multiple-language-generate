# Hexo Multiple Language Generate

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/QuillVot/hexo-multiple-language-generate)
[![npm version](https://img.shields.io/npm/v/hexo-multiple-language-generate.svg)](https://www.npmjs.com/package/hexo-multiple-language-generate)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一个简化 Hexo 博客多语言生成和管理的插件。通过简单配置，轻松实现不同语言版本博客的生成。

[English](./README_EN.md) | [日本語](./README_JA.md) | [简体中文](./README.md)

## ✨ 特性

- 🌍 **多语言支持** - 为不同语言内容创建独立的语言目录
- ⚙️ **灵活配置** - 自定义语言设置、URL 结构和输出路径
- 🔌 **轻松集成** - 快速集成到现有 Hexo 项目中
- 🦋 **Butterfly 主题适配** - 针对 Butterfly 主题优化的多语言切换支持
- 🚀 **并行构建** - 每个语言在独立临时目录中并行生成，避免配置文件互相覆盖

## 📦 安装

```bash
npm install hexo-multiple-language-generate --save
```

## 🚀 快速开始

### 1. 前置要求

- Node.js (>= 14.17.0)
- Hexo (>= 5.0.0)
- Butterfly 主题 (可选)

### 2. 项目结构

```
.
├── public/                           # 编译输出目录
├── source-en/                        # 英文内容目录
│   ├── _posts/                       # 英文文章
│   └── about/                        # 英文关于页面
├── source-ja/                        # 日文内容目录
│   ├── _posts/                       # 日文文章
│   └── about/                        # 日文关于页面
├── source-zh/                        # 中文内容目录
│   ├── _posts/                       # 中文文章
│   └── about/                        # 中文关于页面
├── config.butterfly.en.yml           # Butterfly 主题完整配置文件
├── config.butterfly.ja.yml
├── config.butterfly.zh.yml
├── config.en.yml                     # Hexo 基础完整配置文件
├── config.ja.yml
├── config.zh.yml
├── hexo-multiple-language.yml        # 插件配置文件
└── package.json
```

### 3. 配置步骤

#### 3.1 创建插件配置文件

复制 [`hexo-multiple-language.yml`](./template/hexo-multiple-language.yml) 到项目根目录


#### 3.2 语言配置文件调整

在此插件的使用中，不需要原生 Hexo 或 Butterfly 主题中的 `_config.yml`、`_config.butterfly.yml ` 等配置文件。插件会根据不同语言自动生成对应的配置文件，需手动维护多个语言`yml`配置。

> **重要：`config.[lang].yml` 必须是完整的 Hexo 配置文件，不是差异配置片段。**
>
> 插件会将 `config.zh.yml`、`config.en.yml` 等文件直接复制为构建时使用的 `_config.yml`，不会与原始 `_config.yml` 做合并。如果只写 `url`、`root`、`source_dir` 等差异字段，`theme`、站点信息、插件配置、部署配置等未写入的内容都会丢失，可能导致主题回退到默认 Landscape 或生成结果异常。
>
> 推荐做法：先复制一份完整的 `_config.yml` 为 `config.zh.yml`、`config.en.yml`、`config.ja.yml`，再分别修改下面示例中的语言相关字段。Butterfly 配置同理，`config.butterfly.[lang].yml` 也应从完整的 `_config.butterfly.yml` 复制后调整。

##### 中文配置片段 (config.zh.yml)
```yaml
# URL配置
url: https://quillvot.github.io/
root: /

# 目录配置
source_dir: source-zh
public_dir: public

# 忽略目录
ignore:
  - source-en/
  - source-ja/
```

##### 英文配置片段 (config.en.yml)
```yaml
# URL
url: https://quillvot.github.io/en
root: /en/

# Directory
source_dir: source-en
public_dir: public-en

# Ignore
ignore:
  - source-zh/
  - source-ja/
```

##### 日文配置片段 (config.ja.yml)
```yaml
# URL
url: https://quillvot.github.io/ja
root: /ja/

# ディレクトリ
source_dir: source-ja
public_dir: public-ja

# 除外
ignore:
  - source-zh/
  - source-en/
```

### 4. Butterfly 主题配置

为不同语言版本配置导航菜单的语言切换选项：`multiple-language-switch`

> **注意：以下 Butterfly 配置也只是需要按语言调整的片段。** 实际的 `config.butterfly.[lang].yml` 应包含完整主题配置，否则未写入的主题选项会丢失。

#### 中文配置片段 (config.butterfly.zh.yml)
```yaml
menu:
  语言||fas fa-language:
    English: en || fa-solid fa-language multiple-language-switch
    にほんご: ja || fa-solid fa-language multiple-language-switch
    中文: zh || fa-solid fa-language multiple-language-switch

# 其他 Butterfly 主题配置...
```

#### 英文配置片段 (config.butterfly.en.yml)
```yaml
menu:
  Language||fas fa-language:
    中文: zh || fa-solid fa-language multiple-language-switch
    にほんご: ja || fa-solid fa-language multiple-language-switch
    English: en || fa-solid fa-language multiple-language-switch

# Other Butterfly theme configurations...
```

#### 日文配置片段 (config.butterfly.ja.yml)
```yaml
menu:
  げんご||fas fa-language:
    English: en || fa-solid fa-language multiple-language-switch
    中文: zh || fa-solid fa-language multiple-language-switch
    にほんご: ja || fa-solid fa-language multiple-language-switch

# その他の Butterfly テーマ設定...
```

## 🔧 使用方法

### 基本命令

替代原有的 `hexo generate` 命令：

```bash
hexo multiple-language-generate
```

插件会为默认语言和所有启用的其他语言创建独立临时构建目录，并并行执行 Hexo 生成流程。生成完成后，默认语言输出会作为最终 `public` 目录，其他语言输出会合并到对应的语言子目录中。

### 开发模式

生成并启动本地服务器：

```bash
hexo multiple-language-generate && hexo s
```

### 部署命令

生成并部署：

```bash
hexo multiple-language-generate && hexo deploy
```

## 📝 配置参考

### hexo-multiple-language.yml 完整配置项

```yaml
# Hexo多语言站点配置
# 用于生成多语言版本的静态博客站点
hexo-multiple-language:
  # ===== 默认语言配置 =====
  default-language:
    # Hexo默认语言的生成目录，需与 config.zh.yml 中的 public_dir 保持一致
    "generate-dir": "public"

    # 默认语言的完整配置文件列表
    # 插件会将这些文件复制为构建目录中的 _config*.yml，不会与原始配置合并
    "config-file-name": [
      "config.zh",           # Hexo主配置文件
      "config.butterfly.zh"  # Butterfly主题配置文件
    ]

  # ===== 其他语言配置 =====
  # 可配置多个其他语言版本
  other-language: [
    {
      "enable": true,              # 是否启用该语言
      "generate-dir": "public-en", # 当前语言的生成目录，需与 config.en.yml 中的 public_dir 保持一致
      "language-path": "en",       # 合并到默认语言输出目录下的子目录名
      # 当前语言的完整配置文件列表
      # 插件会将这些文件复制为构建目录中的 _config*.yml，不会与原始配置合并
      "config-file-name": [
        "config.en",              # 英文版Hexo配置
        "config.butterfly.en"     # 英文版主题配置
      ]
    },
    {
      "enable": true,
      "generate-dir": "public-ja", # 需与 config.ja.yml 中的 public_dir 保持一致
      "language-path": "ja",       # 合并到默认语言输出目录下的子目录名
      # 当前语言的完整配置文件列表
      # 插件会将这些文件复制为构建目录中的 _config*.yml，不会与原始配置合并
      "config-file-name": [
        "config.ja",
        "config.butterfly.ja"
      ]
    }
  ]

  # ===== 语言切换配置 =====
  # 基于浏览器语言自动切换或手动切换的相关配置
  switch-language:
    # 是否启用语言切换功能
    enable: true

    # 需要自动注入语言切换脚本的主题配置文件名前缀
    # 例如 config.butterfly 会匹配 config.butterfly.zh、config.butterfly.en 等配置文件
    support-theme: "config.butterfly"

    # 手动切换语言后的有效期(单位:毫秒)
    storage-ttl: 100000

    # 当浏览器语言不匹配时使用的默认语言
    not-matched-use: 'en'

    # 默认语言支持的语言代码列表
    default-language: [
      "zh",
      "zh-CN"
    ]

    # 其他语言支持的语言代码映射
    # key: 对应已启用语言的 language-path 值
    # value: 该语言支持的语言代码列表，value可配置多个，如 "ja":["ja","en-CA"]，表示浏览器设置的语言是加拿大英语，默认也显示日语
    other-language: {
      "en": ["en"],
      "ja": ["ja"]
    }

```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支：`git checkout -b my-new-feature`
3. 提交改动：`git commit -am 'Add some feature'`
4. 推送分支：`git push origin my-new-feature`
5. 提交 Pull Request

## 📃 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 了解详情

## 🔗 相关链接

- [在线演示](https://quillvot.github.io)
- [NPM 包地址](https://www.npmjs.com/package/hexo-multiple-language-generate)
- [GitHub 仓库](https://github.com/QuillVot/hexo-multiple-language-generate)
- [问题反馈](https://github.com/QuillVot/hexo-multiple-language-generate/issues)

## ❤️ 致谢

感谢所有贡献者以及 Hexo 和 Butterfly 主题的开发者。
