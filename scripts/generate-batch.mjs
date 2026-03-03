#!/usr/bin/env node

/**
 * 一括記事生成スクリプト
 *
 * キーワードリスト（CSV or テキスト）から複数の記事テンプレートを一括生成します。
 *
 * 使い方:
 *   node scripts/generate-batch.mjs --file keywords.txt
 *   node scripts/generate-batch.mjs --file keywords.csv
 *
 * キーワードファイルの形式:
 *   1行1キーワード（テキストファイル）
 *   または: キーワード,カテゴリ,タグ1|タグ2|タグ3（CSVファイル）
 *
 * 例 (keywords.txt):
 *   ChatGPT 使い方 初心者
 *   Midjourney 料金プラン
 *   Claude vs ChatGPT 比較
 *
 * 例 (keywords.csv):
 *   ChatGPT 使い方 初心者,AIチャット,ChatGPT|初心者|使い方
 *   Midjourney 料金プラン,AI画像生成,Midjourney|料金
 */

import { readFileSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';
import { join } from 'path';

const SCRIPT_DIR = import.meta.dirname;

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

function main() {
  const { file } = parseArgs();

  if (!file) {
    console.error('エラー: キーワードファイルを指定してください');
    console.error('');
    console.error('使い方:');
    console.error('  node scripts/generate-batch.mjs --file keywords.txt');
    console.error('');
    console.error('キーワードファイルの形式:');
    console.error('  1行1キーワード（テキストファイル）');
    console.error('  または: キーワード,カテゴリ,タグ1|タグ2（CSVファイル）');
    process.exit(1);
  }

  if (!existsSync(file)) {
    console.error(`エラー: ファイルが見つかりません: ${file}`);
    process.exit(1);
  }

  const lines = readFileSync(file, 'utf-8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

  console.log(`${lines.length} 件のキーワードを処理します...\n`);

  let success = 0;
  let skipped = 0;

  for (const line of lines) {
    const parts = line.split(',').map((p) => p.trim());
    const keyword = parts[0];
    const category = parts[1] || 'AI総合';
    const tags = parts[2] ? parts[2].replace(/\|/g, ',') : '';

    const cmdArgs = [
      join(SCRIPT_DIR, 'generate-article.mjs'),
      '--keyword',
      keyword,
      '--category',
      category,
    ];
    if (tags) {
      cmdArgs.push('--tags', tags);
    }

    try {
      const output = execFileSync('node', cmdArgs, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      console.log(`[OK] ${keyword}`);
      success++;
    } catch (err) {
      console.log(`[スキップ] ${keyword} - ${err.stderr?.trim() || 'エラー'}`);
      skipped++;
    }
  }

  console.log(`\n完了: ${success} 件生成, ${skipped} 件スキップ`);
}

main();
