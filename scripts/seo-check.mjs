#!/usr/bin/env node

/**
 * SEOチェックスクリプト
 *
 * 記事のSEO品質をチェックし、改善点を提案します。
 *
 * 使い方:
 *   node scripts/seo-check.mjs                    # すべての記事をチェック
 *   node scripts/seo-check.mjs --file 記事名.md   # 特定の記事をチェック
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const CONTENT_DIR = join(import.meta.dirname, '..', 'src', 'content', 'blog');

function parseArgs() {
  const args = process.argv.slice(2);
  let file = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && args[i + 1]) {
      file = args[i + 1];
      i++;
    }
  }

  return { file };
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const fm = {};
  const lines = match[1].split('\n');
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > -1) {
      const key = line.substring(0, colonIdx).trim();
      let value = line.substring(colonIdx + 1).trim();
      // Remove quotes
      if (
        (value.startsWith("'") && value.endsWith("'")) ||
        (value.startsWith('"') && value.endsWith('"'))
      ) {
        value = value.slice(1, -1);
      }
      fm[key] = value;
    }
  }
  return fm;
}

function checkArticle(filepath, filename) {
  const content = readFileSync(filepath, 'utf-8');
  const fm = parseFrontmatter(content);
  const body = content.replace(/^---[\s\S]*?---/, '').trim();

  const issues = [];
  const warnings = [];
  const info = [];

  // タイトルチェック
  const title = fm.title || '';
  if (!title) {
    issues.push('タイトルがありません');
  } else {
    if (title.length < 15) warnings.push(`タイトルが短すぎます (${title.length}文字, 推奨: 25-40文字)`);
    if (title.length > 60) warnings.push(`タイトルが長すぎます (${title.length}文字, 推奨: 25-40文字)`);
    else info.push(`タイトル: ${title.length}文字`);
  }

  // ディスクリプションチェック
  const desc = fm.description || '';
  if (!desc) {
    issues.push('ディスクリプションがありません');
  } else {
    if (desc.length < 50)
      warnings.push(`ディスクリプションが短すぎます (${desc.length}文字, 推奨: 80-160文字)`);
    if (desc.length > 160)
      warnings.push(`ディスクリプションが長すぎます (${desc.length}文字, 推奨: 80-160文字)`);
    else info.push(`ディスクリプション: ${desc.length}文字`);
  }

  // 本文の長さチェック
  const charCount = body.replace(/[#\-|*`\[\]()]/g, '').length;
  if (charCount < 500) warnings.push(`本文が短すぎます (${charCount}文字, 推奨: 2000文字以上)`);
  else if (charCount < 2000)
    warnings.push(`本文がやや短いです (${charCount}文字, 推奨: 2000文字以上)`);
  else info.push(`本文: ${charCount}文字`);

  // 見出し構造チェック
  const h2Count = (body.match(/^## /gm) || []).length;
  const h3Count = (body.match(/^### /gm) || []).length;
  if (h2Count === 0) issues.push('h2見出しがありません');
  if (h2Count < 3) warnings.push(`h2見出しが少ないです (${h2Count}個, 推奨: 3個以上)`);
  else info.push(`h2: ${h2Count}個, h3: ${h3Count}個`);

  // カテゴリ・タグチェック
  if (!fm.category) warnings.push('カテゴリが設定されていません');
  if (!fm.tags || fm.tags === '[]') warnings.push('タグが設定されていません');

  // 未完成チェック
  const hasPlaceholders = body.includes('<!-- ') && body.includes(' -->');
  if (hasPlaceholders) warnings.push('未記入のプレースホルダー（<!-- -->）があります');

  // 内部リンクチェック
  const internalLinks = (body.match(/\[.*?\]\(\/.*?\)/g) || []).length;
  if (internalLinks === 0)
    warnings.push('内部リンクがありません（他の記事へのリンクを追加推奨）');
  else info.push(`内部リンク: ${internalLinks}個`);

  return { filename, issues, warnings, info };
}

function main() {
  const { file } = parseArgs();

  let files;
  if (file) {
    files = [file];
  } else {
    files = readdirSync(CONTENT_DIR).filter(
      (f) => f.endsWith('.md') || f.endsWith('.mdx'),
    );
  }

  console.log(`SEOチェック: ${files.length} 件の記事を分析中...\n`);

  let totalIssues = 0;
  let totalWarnings = 0;

  for (const f of files) {
    const filepath = join(CONTENT_DIR, f);
    const result = checkArticle(filepath, f);

    console.log(`--- ${result.filename} ---`);

    if (result.issues.length > 0) {
      result.issues.forEach((i) => console.log(`  [NG] ${i}`));
      totalIssues += result.issues.length;
    }
    if (result.warnings.length > 0) {
      result.warnings.forEach((w) => console.log(`  [注意] ${w}`));
      totalWarnings += result.warnings.length;
    }
    if (result.info.length > 0) {
      result.info.forEach((i) => console.log(`  [OK] ${i}`));
    }

    console.log('');
  }

  console.log('=== サマリー ===');
  console.log(`記事数: ${files.length}`);
  console.log(`問題: ${totalIssues} 件`);
  console.log(`警告: ${totalWarnings} 件`);

  if (totalIssues > 0) {
    console.log('\n[NG] の項目は優先的に修正してください。');
  }
}

main();
