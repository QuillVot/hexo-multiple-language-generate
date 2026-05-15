# Hexo Multiple Language Generate

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/QuillVot/hexo-multiple-language-generate)
[![npm version](https://img.shields.io/npm/v/hexo-multiple-language-generate.svg)](https://www.npmjs.com/package/hexo-multiple-language-generate)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Hexoブログの多言語生成と管理を簡素化するプラグインです。簡単な設定で、異なる言語バージョンのブログを生成できます。

[English](./README_EN.md) | [日本語](./README_JA.md) | [简体中文](./README.md)

## ✨ 特徴

- 🌍 **多言語サポート** - 異なる言語コンテンツ用の独立した言語ディレクトリを作成
- ⚙️ **柔軟な設定** - 言語設定、URL構造、出力パスのカスタマイズ
- 🔌 **簡単な統合** - 既存のHexoプロジェクトに素早く統合
- 🦋 **Butterflyテーマ対応** - Butterflyテーマに最適化された多言語切り替えサポート
- 🚀 **並列ビルド** - 各言語を独立した一時ディレクトリで並列生成

## 📦 インストール

```bash
npm install hexo-multiple-language-generate --save
```

## 🚀 クイックスタート

### 1. 前提条件

- Node.js (>= 14.17.0)
- Hexo (>= 5.0.0)
- Butterflyテーマ (オプション)

### 2. プロジェクト構造

```
.
├── public/                           # コンパイル出力ディレクトリ
├── source-en/                        # 英語コンテンツディレクトリ
│   ├── _posts/                       # 英語記事
│   └── about/                        # 英語アバウトページ
├── source-ja/                        # 日本語コンテンツディレクトリ
│   ├── _posts/                       # 日本語記事
│   └── about/                        # 日本語アバウトページ
├── source-zh/                        # 中国語コンテンツディレクトリ
│   ├── _posts/                       # 中国語記事
│   └── about/                        # 中国語アバウトページ
├── config.butterfly.en.yml           # 完全なButterflyテーマ設定ファイル
├── config.butterfly.ja.yml
├── config.butterfly.zh.yml
├── config.en.yml                     # 完全なHexo基本設定ファイル
├── config.ja.yml
├── config.zh.yml
├── hexo-multiple-language.yml        # プラグイン設定ファイル
└── package.json
```

### 3. 設定手順

#### 3.1 プラグイン設定ファイルの作成

[`hexo-multiple-language.yml`](./template/hexo-multiple-language.yml)をプロジェクトのルートディレクトリにコピー

#### 3.2 言語設定ファイルの調整

このプラグインでは、ネイティブのHexoやButterflyテーマの`_config.yml`、`_config.butterfly.yml`などの設定ファイルは不要です。プラグインは異なる言語に応じて対応する設定ファイルを自動生成します。複数の言語`yml`設定を手動で管理する必要があります。

> **重要：`config.[lang].yml` は差分設定ではなく、完全な Hexo 設定ファイルである必要があります。**
>
> このプラグインは `config.zh.yml`、`config.en.yml` などのファイルを、各ビルドで使用する `_config.yml` として直接コピーします。元の `_config.yml` とのマージは行いません。`url`、`root`、`source_dir` などの差分だけを書くと、`theme`、サイト情報、プラグイン設定、デプロイ設定など、書かれていない項目は失われます。その結果、Hexo がデフォルトの Landscape テーマに戻ったり、生成結果が不完全になったりする可能性があります。
>
> 推奨手順：完全な `_config.yml` を `config.zh.yml`、`config.en.yml`、`config.ja.yml` にコピーしてから、下記例のような言語ごとの差分項目を編集してください。Butterfly も同様に、完全な `_config.butterfly.yml` を各 `config.butterfly.[lang].yml` にコピーしてから、メニューや表示テキストなどを調整してください。

##### 中国語設定スニペット (config.zh.yml)
```yaml
# URL設定
url: https://quillvot.github.io/
root: /

# ディレクトリ設定
source_dir: source-zh
public_dir: public

# 除外ディレクトリ
ignore:
  - source-en/
  - source-ja/
```

##### 英語設定スニペット (config.en.yml)
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

##### 日本語設定スニペット (config.ja.yml)
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

### 4. Butterflyテーマの設定

異なる言語バージョンのナビゲーションメニューに言語切り替えオプションを設定：`multiple-language-switch`

> **注意：以下の Butterfly 設定例は、言語ごとに変更する部分だけを示したスニペットです。** 実際の `config.butterfly.[lang].yml` には完全なテーマ設定を含めてください。省略されたテーマ設定は失われます。

#### 中国語設定スニペット (config.butterfly.zh.yml)
```yaml
menu:
  语言||fas fa-language:
    English: en || fa-solid fa-language multiple-language-switch
    にほんご: ja || fa-solid fa-language multiple-language-switch
    中文: zh || fa-solid fa-language multiple-language-switch

# その他のButterflyテーマ設定...
```

#### 英語設定スニペット (config.butterfly.en.yml)
```yaml
menu:
  Language||fas fa-language:
    中文: zh || fa-solid fa-language multiple-language-switch
    にほんご: ja || fa-solid fa-language multiple-language-switch
    English: en || fa-solid fa-language multiple-language-switch

# Other Butterfly theme configurations...
```

#### 日本語設定スニペット (config.butterfly.ja.yml)
```yaml
menu:
  げんご||fas fa-language:
    English: en || fa-solid fa-language multiple-language-switch
    中文: zh || fa-solid fa-language multiple-language-switch
    にほんご: ja || fa-solid fa-language multiple-language-switch

# その他のButterflyテーマ設定...
```

## 🔧 使用方法

### 基本コマンド

既存の`hexo generate`コマンドの代替：

```bash
hexo multiple-language-generate
```

プラグインはデフォルト言語と有効化された各言語ごとに独立した一時ビルドディレクトリを作成し、Hexo の生成処理を並列実行します。生成完了後、デフォルト言語の出力を最終的な `public` ディレクトリとして使い、他言語の出力を対応する言語サブディレクトリへマージします。

### 開発モード

生成してローカルサーバーを起動：

```bash
hexo multiple-language-generate && hexo s
```

### デプロイコマンド

生成してデプロイ：

```bash
hexo multiple-language-generate && hexo deploy
```

## 📝 設定リファレンス

### hexo-multiple-language.yml 完全な設定項目

```yaml
# Hexo多言語サイト設定
# 多言語バージョンの静的ブログサイトを生成するために使用
hexo-multiple-language:
  # ===== デフォルト言語設定 =====
  default-language:
    # Hexoデフォルト言語の生成ディレクトリ。config.zh.yml の public_dir と一致させてください
    "generate-dir": "public"

    # デフォルト言語の完全な設定ファイルリスト
    # プラグインはこれらをビルドディレクトリの _config*.yml としてコピーし、元の設定ファイルとはマージしません
    "config-file-name": [
      "config.zh",           # Hexoメイン設定ファイル
      "config.butterfly.zh"  # Butterflyテーマ設定ファイル
    ]

  # ===== その他の言語設定 =====
  # 複数の他言語バージョンを設定可能
  other-language: [
    {
      "enable": true,              # この言語を有効にするかどうか
      "generate-dir": "public-en", # この言語の生成ディレクトリ。config.en.yml の public_dir と一致させてください
      "language-path": "en",       # デフォルト言語の出力ディレクトリにマージされるサブディレクトリ名
      # この言語の完全な設定ファイルリスト
      # プラグインはこれらをビルドディレクトリの _config*.yml としてコピーし、元の設定ファイルとはマージしません
      "config-file-name": [
        "config.en",              # 英語版Hexo設定
        "config.butterfly.en"     # 英語版テーマ設定
      ]
    },
    {
      "enable": true,
      "generate-dir": "public-ja", # config.ja.yml の public_dir と一致させてください
      "language-path": "ja",       # デフォルト言語の出力ディレクトリにマージされるサブディレクトリ名
      # この言語の完全な設定ファイルリスト
      # プラグインはこれらをビルドディレクトリの _config*.yml としてコピーし、元の設定ファイルとはマージしません
      "config-file-name": [
        "config.ja",
        "config.butterfly.ja"
      ]
    }
  ]

  # ===== 言語切り替え設定 =====
  # ブラウザ言語による自動切り替えまたは手動切り替えの関連設定
  switch-language:
    # 言語切り替え機能を有効にするかどうか
    enable: true

    # 言語切り替えスクリプトを自動注入するテーマ設定ファイル名のプレフィックス
    # 例: config.butterfly は config.butterfly.zh、config.butterfly.en などにマッチします
    support-theme: "config.butterfly"

    # 手動で言語を切り替えた後の有効期限（ミリ秒）
    storage-ttl: 100000

    # ブラウザ言語が一致しない場合に使用するデフォルト言語
    not-matched-use: 'en'

    # デフォルト言語がサポートする言語コードリスト
    default-language: [
      "zh",
      "zh-CN"
    ]

    # その他の言語がサポートする言語コードマッピング
    # key: 有効化された language-path の値に対応
    # value: その言語がサポートする言語コードリスト。valueは複数設定可能。例：「ja」：[「ja」,「en-CA」]は、ブラウザ設定がカナダ英語でも日本語をデフォルト表示
    other-language: {
      "en": ["en"],
      "ja": ["ja"]
    }

```

## 🤝 貢献ガイド

1. このリポジトリをフォーク
2. 機能ブランチを作成：`git checkout -b my-new-feature`
3. 変更をコミット：`git commit -am 'Add some feature'`
4. ブランチをプッシュ：`git push origin my-new-feature`
5. Pull Requestを提出

## 📃 ライセンス

このプロジェクトはMITライセンスの下で公開されています - 詳細は[LICENSE](LICENSE)をご覧ください

## 🔗 関連リンク

- [オンラインデモ](https://quillvot.github.io)
- [NPMパッケージ](https://www.npmjs.com/package/hexo-multiple-language-generate)
- [GitHubリポジトリ](https://github.com/QuillVot/hexo-multiple-language-generate)
- [問題報告](https://github.com/QuillVot/hexo-multiple-language-generate/issues)

## ❤️ 謝辞

すべての貢献者、およびHexoとButterflyテーマの開発者に感謝いたします。
