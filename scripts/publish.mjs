#!/usr/bin/env node

/**
 * 自動公開スクリプト
 *
 * 記事をgit add → commit → pushして自動デプロイします。
 * Cloudflare Pagesと連携していれば、pushと同時にサイトが更新されます。
 *
 * 使い方:
 *   node scripts/publish.mjs                     # 変更をすべてコミット・プッシュ
 *   node scripts/publish.mjs --message "新記事追加"  # カスタムコミットメッセージ
 *   node scripts/publish.mjs --dry-run            # 実行せずに確認のみ
 */

import { execSync } from 'child_process';
import { join } from 'path';

const PROJECT_DIR = join(import.meta.dirname, '..');

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { message: '', dryRun: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--message' && args[i + 1]) {
      result.message = args[i + 1];
      i++;
    } else if (args[i] === '--dry-run') {
      result.dryRun = true;
    }
  }

  return result;
}

function run(cmd, options = {}) {
  console.log(`> ${cmd}`);
  try {
    const output = execSync(cmd, {
      cwd: PROJECT_DIR,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options,
    });
    if (output.trim()) console.log(output.trim());
    return output;
  } catch (err) {
    console.error(`エラー: ${err.stderr?.trim() || err.message}`);
    throw err;
  }
}

function main() {
  const { message, dryRun } = parseArgs();

  console.log('=== 公開スクリプト ===\n');

  // git status確認
  let status;
  try {
    status = run('git status --porcelain');
  } catch {
    console.error('エラー: gitリポジトリが初期化されていません。');
    console.error('以下を実行してください:');
    console.error('  cd income-blog');
    console.error('  git init');
    console.error('  git remote add origin <GitHubリポジトリURL>');
    process.exit(1);
  }

  if (!status.trim()) {
    console.log('変更がありません。公開するものはありません。');
    return;
  }

  console.log('変更されたファイル:');
  console.log(status);

  // 新規/変更された記事を数える
  const blogChanges = status
    .split('\n')
    .filter((l) => l.includes('src/content/blog/'));
  const commitMessage =
    message || `記事更新: ${blogChanges.length}件の記事を追加/更新`;

  if (dryRun) {
    console.log('\n[ドライラン] 以下のコマンドが実行されます:');
    console.log(`  git add -A`);
    console.log(`  git commit -m "${commitMessage}"`);
    console.log(`  git push origin main`);
    console.log('\n実際に実行するには --dry-run を外してください。');
    return;
  }

  // git add & commit & push
  run('git add -A');
  run(`git commit -m "${commitMessage}"`);

  try {
    run('git push origin main');
    console.log('\n公開完了! Cloudflare Pagesで自動ビルドが開始されます。');
  } catch {
    console.error(
      '\npushに失敗しました。リモートリポジトリの設定を確認してください。',
    );
    console.error('ローカルへのコミットは完了しています。');
  }
}

main();
