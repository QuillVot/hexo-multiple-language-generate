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
- 🚀 **Parallel Building** - Generate every language in an isolated temporary directory in parallel

## 📦 Installation

```bash
npm install hexo-multiple-language-generate --save
```

## 🚀 Quick Start

### 1. Prerequisites

- Node.js (>= 14.17.0)
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
├── config.butterfly.en.yml           # Complete Butterfly theme configuration file
├── config.butterfly.ja.yml
├── config.butterfly.zh.yml
├── config.en.yml                     # Complete Hexo base configuration file
├── config.ja.yml
├── config.zh.yml
├── hexo-multiple-language.yml        # Plugin configuration file
└── package.json
```

### 3. Configuration Steps

#### 3.1 Create Plugin Configuration File

Copy [`hexo-multiple-language.yml`](./template/hexo-multiple-language.yml) to your project root directory

#### 3.2 Language Configuration File Adjustment

This plugin doesn't require the native Hexo or Butterfly theme `_config.yml`, `_config.butterfly.yml` configuration files. The plugin automatically generates corresponding configuration files based on different languages, requiring manual maintenance of multiple language `yml` configurations.

> **Important: `config.[lang].yml` must be a complete Hexo configuration file, not a partial diff.**
>
> The plugin copies `config.zh.yml`, `config.en.yml`, and similar files directly to the `_config.yml` used during each build. It does not merge them with the original `_config.yml`. If you only write different fields such as `url`, `root`, or `source_dir`, omitted settings such as `theme`, site metadata, plugin options, and deploy configuration will be lost. This can make Hexo fall back to the default Landscape theme or generate an incomplete site.
>
> Recommended workflow: copy your full `_config.yml` to `config.zh.yml`, `config.en.yml`, and `config.ja.yml`, then edit the language-specific fields shown in the examples below. Use the same approach for Butterfly: copy the full `_config.butterfly.yml` to each `config.butterfly.[lang].yml` before adjusting language-specific menu or text.

##### Chinese Configuration Snippet (config.zh.yml)
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

##### English Configuration Snippet (config.en.yml)
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

##### Japanese Configuration Snippet (config.ja.yml)
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

> **Note: the Butterfly examples below are snippets of fields that usually differ by language.** The actual `config.butterfly.[lang].yml` files should contain the full theme configuration, otherwise omitted theme options will be lost.

#### Chinese Configuration Snippet (config.butterfly.zh.yml)
```yaml
menu:
  语言||fas fa-language:
    English: en || fa-solid fa-language multiple-language-switch
    にほんご: ja || fa-solid fa-language multiple-language-switch
    中文: zh || fa-solid fa-language multiple-language-switch

# Other Butterfly theme configurations...
```

#### English Configuration Snippet (config.butterfly.en.yml)
```yaml
menu:
  Language||fas fa-language:
    中文: zh || fa-solid fa-language multiple-language-switch
    にほんご: ja || fa-solid fa-language multiple-language-switch
    English: en || fa-solid fa-language multiple-language-switch

# Other Butterfly theme configurations...
```

#### Japanese Configuration Snippet (config.butterfly.ja.yml)
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

The plugin creates an isolated temporary build directory for the default language and every enabled additional language, then runs Hexo generation in parallel. After generation finishes, the default language output becomes the final `public` directory and the other language outputs are merged into their language subdirectories.

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
    # Generation directory for the Hexo default language; keep it consistent with public_dir in config.zh.yml
    "generate-dir": "public"

    # List of complete configuration files for the default language
    # The plugin copies them to _config*.yml in the build directory; it does not merge them with the original config files
    "config-file-name": [
      "config.zh",           # Hexo main configuration file
      "config.butterfly.zh"  # Butterfly theme configuration file
    ]

  # ===== Other Language Configuration =====
  # Configure multiple other language versions
  other-language: [
    {
      "enable": true,              # Whether to enable this language
      "generate-dir": "public-en", # Generation directory for this language; keep it consistent with public_dir in config.en.yml
      "language-path": "en",       # Subdirectory name merged into the default language output directory
      # List of complete configuration files for this language
      # The plugin copies them to _config*.yml in the build directory; it does not merge them with the original config files
      "config-file-name": [
        "config.en",              # English version Hexo configuration
        "config.butterfly.en"     # English version theme configuration
      ]
    },
    {
      "enable": true,
      "generate-dir": "public-ja", # Keep it consistent with public_dir in config.ja.yml
      "language-path": "ja",       # Subdirectory name merged into the default language output directory
      # List of complete configuration files for this language
      # The plugin copies them to _config*.yml in the build directory; it does not merge them with the original config files
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

    # Theme configuration filename prefix used for automatic language-switch script injection
    # For example, config.butterfly matches config.butterfly.zh, config.butterfly.en, and similar files
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
    # key: corresponds to an enabled language-path value
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
