Here's the English translation of your Markdown document:

# Hexo Multiple Language Generate

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/QuillVot/hexo-multiple-language-generate)
[![npm version](https://img.shields.io/npm/v/hexo-multiple-language-generate.svg)](https://www.npmjs.com/package/hexo-multiple-language-generate)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A plugin that simplifies multi-language generation and management for Hexo blogs. Generate different language versions of your blog with simple configuration.

[English](./README_EN.md) | [日本語](./README_JA.md) | [简体中文](./README.md)

## ✨ Features

- 🌍 **Multi-language Support** - Create independent language directories for different language content
- ⚙️ **Flexible Configuration** - Customize language settings, URL structure, and output paths
- 🔌 **Easy Integration** - Quick integration into existing Hexo projects
- 🦋 **Butterfly Theme Compatible** - Optimized multi-language switching support for Butterfly theme
- 🚀 **Efficient Building** - Optimized build process with parallel processing support

## 📦 Installation

```bash
npm install hexo-multiple-language-generate --save
```

## 🚀 Quick Start

### 1. Prerequisites

- Node.js (>= 12.0.0)
- Hexo (>= 5.0.0)
- Butterfly theme (optional)

### 2. Project Structure

```
.
├── public/                           # Compiled output directory
├── source-en/                        # English content directory
│   ├── _posts/                       # English articles
│   └── about/                        # English about page
├── source-ja/                        # Japanese content directory
│   ├── _posts/                       # Japanese articles
│   └── about/                        # Japanese about page
├── source-zh/                        # Chinese content directory
│   ├── _posts/                       # Chinese articles
│   └── about/                        # Chinese about page
├── config.butterfly.en.yml/          # Butterfly theme configuration files
├── config.butterfly.ja.yml/
├── config.butterfly.zh.yml/
├── config.en.yml/                    # Hexo base configuration files
├── config.ja.yml/
├── config.zh.yml/
├── hexo-multiple-language.yml        # Plugin configuration file
└── package.json
```

### 3. Configuration Steps

#### 3.1 Create Plugin Configuration File

Copy [`hexo-multiple-language.yml`](./template/hexo-multiple-language.yml) to your project root directory

#### 3.2 Language Configuration File Adjustment

This plugin doesn't require the native Hexo or Butterfly theme `_config.yml`, `_config.butterfly.yml` configuration files. The plugin automatically generates corresponding configuration files based on different languages, requiring manual maintenance of multiple language `yml` configurations.

##### Chinese Configuration (config.zh.yml)
```yaml
# URL Configuration
url: https://quillvot.github.io/
root: /

# Directory Configuration
source_dir: source-zh
public_dir: public

# Ignore Directories
ignore:
  - source-en/
  - source-ja/
```

##### English Configuration (config.en.yml)
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

##### Japanese Configuration (config.ja.yml)
```yaml
# URL
url: https://quillvot.github.io/ja
root: /ja/

# Directory
source_dir: source-ja
public_dir: public-ja

# Ignore
ignore:
  - source-zh/
  - source-en/
```

### 4. Butterfly Theme Configuration

Configure language switching options in navigation menu for different language versions: `multiple-language-switch`

#### Chinese (config.butterfly.zh.yml)
```yaml
menu:
  语言||fas fa-language:
    English: en || fa-solid fa-language multiple-language-switch
    にほんご: ja || fa-solid fa-language multiple-language-switch
    中文: zh || fa-solid fa-language multiple-language-switch

# Other Butterfly theme configurations...
```

#### English (config.butterfly.en.yml)
```yaml
menu:
  Language||fas fa-language:
    中文: zh || fa-solid fa-language multiple-language-switch
    にほんご: ja || fa-solid fa-language multiple-language-switch
    English: en || fa-solid fa-language multiple-language-switch

# Other Butterfly theme configurations...
```

#### Japanese (config.butterfly.ja.yml)
```yaml
menu:
  げんご||fas fa-language:
    English: en || fa-solid fa-language multiple-language-switch
    中文: zh || fa-solid fa-language multiple-language-switch
    にほんご: ja || fa-solid fa-language multiple-language-switch

# Other Butterfly theme configurations...
```

## 🔧 Usage

### Basic Command

Replace the original `hexo generate` command:

```bash
hexo multiple-language-generate
```

### Development Mode

Generate and start local server:

```bash
hexo multiple-language-generate && hexo s
```

### Deploy Command

Generate and deploy:

```bash
hexo multiple-language-generate && hexo deploy
```

## 📝 Configuration Reference

### Complete Configuration Options for hexo-multiple-language.yml

```yaml
# Hexo Multi-language Site Configuration
# For generating multi-language versions of static blog sites
hexo-multiple-language:
  # ===== Default Language Configuration =====
  default-language:
    # Generation directory for Hexo default language
    "generate-dir": "public"

    # List of configuration files for default language
    # Supports multiple configuration files, loaded and merged in order
    "config-file-name": [
      "config.zh",           # Hexo main configuration file
      "config.butterfly.zh"  # Butterfly theme configuration file
    ]

  # ===== Other Language Configuration =====
  # Configure multiple other language versions
  other-language: [
    {
      "enable": true,              # Whether to enable this language
      "generate-dir": "public-en", # Generation directory for current language
      "language-path": "en",       # Subdirectory name under main language directory
      "config-file-name": [
        "config.en",              # English version Hexo configuration
        "config.butterfly.en"     # English version theme configuration
      ]
    },
    {
      "enable": true,
      "generate-dir": "public-ja",
      "language-path": "ja",
      "config-file-name": [
        "config.ja",
        "config.butterfly.ja"
      ]
    }
  ]

  # ===== Language Switching Configuration =====
  # Configuration for automatic browser language switching or manual switching
  switch-language:
    # Whether to enable language switching
    enable: true

    # Theme configuration file to use
    support-theme: "config.butterfly"

    # Validity period after manual language switch (in milliseconds)
    storage-ttl: 100000

    # Default language to use when browser language doesn't match
    not-matched-use: 'en'

    # List of language codes supported by default language
    default-language: [
      "zh",
      "zh-CN"
    ]

    # Language code mapping for other languages
    # key: corresponds to language-path value
    # value: list of supported language codes for that language
    other-language: {
      "en": ["en"],
      "ja": ["ja"]
    }
```

## 🤝 Contributing Guide

1. Fork this repository
2. Create feature branch: `git checkout -b my-new-feature`
3. Commit changes: `git commit -am 'Add some feature'`
4. Push branch: `git push origin my-new-feature`
5. Submit Pull Request

## 📃 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details

## 🔗 Related Links

- [Live Demo](https://quillvot.github.io)
- [NPM Package](https://www.npmjs.com/package/hexo-multiple-language-generate)
- [GitHub Repository](https://github.com/QuillVot/hexo-multiple-language-generate)
- [Issue Tracker](https://github.com/QuillVot/hexo-multiple-language-generate/issues)

## ❤️ Acknowledgments

Thanks to all contributors and the developers of Hexo and Butterfly theme.
