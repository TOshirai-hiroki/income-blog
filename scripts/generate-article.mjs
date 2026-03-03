#!/usr/bin/env node

/**
 * 記事自動生成スクリプト
 *
 * 使い方:
 *   node scripts/generate-article.mjs --keyword "ChatGPT 使い方 初心者"
 *   node scripts/generate-article.mjs --keyword "Midjourney vs DALL-E" --category "AI画像生成"
 *
 * このスクリプトは Claude Code と組み合わせて使うことを想定しています。
 * Claude Code のターミナルから実行すると、記事の雛形（Markdownファイル）を自動生成します。
 *
 * 生成される記事のテンプレート:
 * - SEO最適化されたタイトル
 * - メタディスクリプション
 * - 構造化された見出し (h2, h3)
 * - 本文のアウトライン
 * - frontmatter (カテゴリ、タグ、日付)
 */

import { writeFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

// === 設定 ===
const CONTENT_DIR = join(import.meta.dirname, '..', 'src', 'content', 'blog');

const CATEGORIES = [
  'AIチャット',
  'AI画像生成',
  'AI動画生成',
  'AI音声・音楽',
  '業務効率化AI',
  'AIコーディング',
  'AI総合',
];

// === 引数パース ===
function parseArgs() {
  const args = process.argv.slice(2);
  const result = { keyword: '', category: 'AI総合', tags: [] };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--keyword' && args[i + 1]) {
      result.keyword = args[i + 1];
      i++;
    } else if (args[i] === '--category' && args[i + 1]) {
      result.category = args[i + 1];
      i++;
    } else if (args[i] === '--tags' && args[i + 1]) {
      result.tags = args[i + 1].split(',').map((t) => t.trim());
      i++;
    }
  }

  return result;
}

// === スラッグ生成 ===
function generateSlug(keyword) {
  return keyword
    .toLowerCase()
    .replace(/[^\w\s-\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

// === 記事テンプレート生成 ===
function generateArticleTemplate(keyword, category, tags) {
  const today = new Date().toISOString().split('T')[0];
  const slug = generateSlug(keyword);

  // タグの自動生成（キーワードから）
  const autoTags =
    tags.length > 0
      ? tags
      : keyword
          .split(/[\s　]+/)
          .filter((t) => t.length > 1)
          .slice(0, 5);

  const frontmatter = `---
title: '${keyword}【2026年最新】完全ガイド'
description: '${keyword}について徹底解説。初心者にもわかりやすく、料金・機能・使い方を比較します。2026年最新の情報をお届けします。'
pubDate: ${today}
category: '${category}'
tags: [${autoTags.map((t) => `'${t}'`).join(', ')}]
affiliate: true
---`;

  const body = `
${keyword}について、2026年最新の情報をもとに徹底解説します。

## ${keyword}とは

<!-- ここにツール/サービスの概要を記述 -->

## 主な特徴

### 特徴1

<!-- 特徴の詳細 -->

### 特徴2

<!-- 特徴の詳細 -->

### 特徴3

<!-- 特徴の詳細 -->

## 料金プラン

| プラン名 | 月額料金 | 主な機能 |
|----------|---------|---------|
| 無料プラン | 0円 | 基本機能 |
| スタンダード | 要確認 | 全機能 |
| プロ | 要確認 | 全機能+優先サポート |

## メリット・デメリット

### メリット

- **メリット1**: 具体的な説明
- **メリット2**: 具体的な説明
- **メリット3**: 具体的な説明

### デメリット

- **デメリット1**: 具体的な説明
- **デメリット2**: 具体的な説明

## 使い方・始め方

### ステップ1: アカウント登録

<!-- 手順の説明 -->

### ステップ2: 初期設定

<!-- 手順の説明 -->

### ステップ3: 実際に使ってみる

<!-- 手順の説明 -->

## 他のツールとの比較

<!-- 競合ツールとの比較表や説明 -->

## こんな人におすすめ

- おすすめな人1
- おすすめな人2
- おすすめな人3

## よくある質問

### Q. 無料で使えますか？

<!-- 回答 -->

### Q. 日本語に対応していますか？

<!-- 回答 -->

## まとめ

${keyword}は<!-- 総括的な説明 -->。

まずは無料プランから試してみることをおすすめします。
`;

  return { slug, content: frontmatter + '\n' + body };
}

// === メイン処理 ===
function main() {
  const { keyword, category, tags } = parseArgs();

  if (!keyword) {
    console.error('エラー: キーワードを指定してください');
    console.error('');
    console.error('使い方:');
    console.error(
      '  node scripts/generate-article.mjs --keyword "ChatGPT 使い方"',
    );
    console.error(
      '  node scripts/generate-article.mjs --keyword "Midjourney vs DALL-E" --category "AI画像生成"',
    );
    console.error(
      '  node scripts/generate-article.mjs --keyword "AI翻訳" --tags "翻訳,DeepL,Google翻訳"',
    );
    console.error('');
    console.error('利用可能なカテゴリ:');
    CATEGORIES.forEach((c) => console.error(`  - ${c}`));
    process.exit(1);
  }

  const { slug, content } = generateArticleTemplate(keyword, category, tags);
  const filename = `${slug}.md`;
  const filepath = join(CONTENT_DIR, filename);

  if (existsSync(filepath)) {
    console.error(`エラー: ファイルが既に存在します: ${filename}`);
    console.error('別のキーワードを指定するか、既存ファイルを削除してください。');
    process.exit(1);
  }

  writeFileSync(filepath, content, 'utf-8');
  console.log(`記事テンプレートを生成しました: ${filename}`);
  console.log(`ファイルパス: ${filepath}`);
  console.log('');
  console.log('次のステップ:');
  console.log('1. 生成されたファイルの <!-- コメント --> 部分を実際の内容に書き換えてください');
  console.log('2. タイトルとディスクリプションを調整してください');
  console.log('3. node scripts/publish.mjs で公開できます');
}

main();
