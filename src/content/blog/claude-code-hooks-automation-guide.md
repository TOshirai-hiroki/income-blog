---
title: 'Claude Codeの「フック」で自動化が変わる——プロンプトの"お願い"をシステムの"強制"に昇格させる方法'
description: 'Claude Codeのフック機能を公式ドキュメントに基づいて徹底解説。危険コマンドの自動ブロックやTypeScript型チェックの自動化など、実際の導入事例とともに設定方法を紹介します。'
pubDate: 2026-03-23
category: 'AI業界分析'
tags: ['Claude Code', 'AI自動化', 'Hooks', 'Anthropic', '開発効率化', '2026年']
affiliate: false
---

「CLAUDE.mdに『rm -rfは絶対に実行しないで』と書いてあるのに、本当に守られるか不安……」

Claude Codeを使い込んでいるほど、こんな不安を感じたことがあるのではないでしょうか。CLAUDE.mdやsettings.jsonでルールを書いても、それはあくまでAIへの「お願い」。99%は守られるけど、**残りの1%が怖い**。

2025年にリリースされたClaude Codeの**「フック（Hooks）」**機能は、まさにその1%を潰すための仕組みです。この記事では、[Anthropic公式ドキュメント](https://docs.anthropic.com/en/docs/claude-code/hooks)に基づいて、フックの仕組みから実際の導入事例まで解説します。

---

## フックとは何か——「イベント駆動の自動実行」

公式ドキュメントの定義はシンプルです。

> **Hooks are user-defined shell commands that execute at specific points in Claude Code's lifecycle.**
> （フックは、Claude Codeのライフサイクルの特定のポイントで実行される、ユーザー定義のシェルコマンドです）

たとえるなら、**家のセキュリティシステム**に近いイメージです。

- CLAUDE.mdのルール → 「泥棒さん、入らないでください」という**張り紙**
- フック → ドアが開いた瞬間にアラームが鳴る**センサー**

張り紙は無視できますが、センサーは物理的に動作します。フックも同じで、**AIの判断に関係なく、シェルコマンドとして確実に実行される**のが最大の強みです。

---

## フックが反応する主要なタイミング

公式ドキュメントによると、フックは**20以上のライフサイクルイベント**に対応しています。中でも実用上重要なものを抜粋します。

| イベント | いつ発火するか | ブロック可能 | 主な用途 |
|----------|---------------|:-----------:|----------|
| **SessionStart** | セッション開始時 | — | 初期設定の自動注入 |
| **PreToolUse** | ツール実行の直前 | ○ | 危険コマンドのブロック |
| **PostToolUse** | ツール実行の直後 | ○ | 自動フォーマット・型チェック |
| **Stop** | Claudeの応答完了時 | ○ | デスクトップ通知 |
| **UserPromptSubmit** | ユーザーがプロンプトを送信した直後 | ○ | 入力バリデーション |
| **PostToolUseFailure** | ツール実行が失敗した後 | — | エラーログの記録 |

注目すべきは**PreToolUse**です。ツール実行の「直前」に割り込めるので、**AIが何かを実行しようとした瞬間にブロックできる**。これは、プロンプトベースのルールでは絶対に実現できない機能です。

---

## フックの4つのタイプ

公式ドキュメントでは、フックに4つのタイプが定義されています。

| タイプ | 何をするか | 使用頻度 |
|--------|-----------|:--------:|
| **command** | シェルコマンドを実行する | ★★★ |
| **http** | 外部URLにPOSTリクエストを送る（Slack通知など） | ★★☆ |
| **prompt** | Claudeに「この操作は安全か？」をyes/no判定させる | ★☆☆ |
| **agent** | サブエージェントが多段階の検証を行う | ★☆☆ |

実用上、**ほとんどのケースは `command` タイプで事足ります**。まずはこれだけ覚えれば十分です。

---

## 設定ファイルの置き場所——スコープが変わる

フックの設定は `settings.json` に記述します。**どこに置くかで適用範囲が変わる**のがポイントです。

| 設定ファイル | 適用範囲 | Git共有 |
|-------------|---------|:-------:|
| `~/.claude/settings.json` | 全プロジェクト共通 | × |
| `.claude/settings.json` | プロジェクト単位 | ○ |
| `.claude/settings.local.json` | プロジェクト単位（個人用） | × |

> **使い分けのコツ**: 安全ガード（危険コマンドブロック）のように**どのプロジェクトでも必要なもの**はグローバルへ。プロジェクト固有の型チェックやフォーマッタはローカルへ。チームで統一したいルールは `.claude/settings.json` にコミットすればメンバー全員に適用されます。

---

## 実践：実際に導入した2つのフック

ここからは、筆者が実際にプロジェクトに導入したフックを紹介します。

### 実践1：危険コマンドの自動ブロック（グローバル設定）

**課題**: CLAUDE.mdに「`rm -rf`は実行しない」と書いてあるが、AIが100%守る保証はない

**解決策**: `PreToolUse` フックで、Bashコマンド実行前に破壊的なコマンドを自動検出・ブロック

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "python -c \"import sys,json,re; cmd=json.load(sys.stdin).get('tool_input',{}).get('command',''); print(json.dumps({'hookSpecificOutput':{'hookEventName':'PreToolUse','permissionDecision':'deny','permissionDecisionReason':'破壊的な削除コマンドはブロックされました'}}) if re.search(r'rm\\\\s+-rf\\\\s+[/.]|rm\\\\s+-r\\\\s+/|rmdir\\\\s+/s',cmd) else '')\"",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

**仕組みの解説**:

1. `matcher: "Bash"` → Bashツールが使われるときだけ発火
2. 標準入力（stdin）からJSON形式でコマンド内容を受け取る
3. 正規表現で `rm -rf /`、`rm -rf .`、`rm -r /` などを検出
4. マッチしたら `permissionDecision: "deny"` を返してブロック
5. マッチしなければ空文字を返して通過

公式ドキュメントによると、`PreToolUse` フックの出力で `permissionDecision` を `"deny"` に設定すると、**ツールの実行そのものが中止される**仕組みです。

> ここで注意したいのが、この環境には `jq`（JSONを扱うコマンドラインツール）がインストールされていなかったこと。多くの解説記事では `jq` を前提にしていますが、**Pythonの `json` モジュールで完全に代替できます**。Windows環境ではこちらのほうが確実です。

### 実践2：TypeScript型チェックの自動実行（プロジェクトローカル設定）

**課題**: Remotion（動画生成フレームワーク）のプロジェクトで、`.tsx` ファイルの型エラーがレンダリング時まで気づけない

**解決策**: `PostToolUse` フックで、TSXファイル編集後に `tsc --noEmit` を自動実行

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "python -c \"import sys,json; data=json.load(sys.stdin); fp=data.get('tool_response',{}).get('filePath','') or data.get('tool_input',{}).get('file_path',''); exit(0) if not fp.endswith(('.tsx','.ts')) else None; import subprocess; r=subprocess.run(['npx','tsc','--noEmit'],capture_output=True,text=True,cwd='プロジェクトパス',timeout=30); errors=r.stdout.strip() or r.stderr.strip(); print(json.dumps({'hookSpecificOutput':{'hookEventName':'PostToolUse','systemMessage':'TypeScript型チェック結果:\\n'+errors[:500]}}) if errors and r.returncode!=0 else '')\"",
            "timeout": 35,
            "statusMessage": "TypeScript 型チェック中..."
          }
        ]
      }
    ]
  }
}
```

**仕組みの解説**:

1. `matcher: "Write|Edit"` → ファイル作成・編集時に発火
2. 編集されたファイルの拡張子が `.tsx` か `.ts` かチェック
3. 該当する場合のみ `npx tsc --noEmit` を実行
4. 型エラーがあれば `systemMessage` としてClaudeに返す
5. エラーがなければ何も出力せず、**正常時は完全に透明**

ポイントは `statusMessage` フィールドです。型チェック中にターミナルに「TypeScript 型チェック中...」と表示されるので、フックが動いていることが分かります。

---

## CLAUDE.mdのルール vs フック——どう使い分ける？

「じゃあ全部フックにすればいい？」——答えはNoです。

| 観点 | CLAUDE.md / Playbook | Hooks |
|------|---------------------|-------|
| **得意なこと** | 文脈を踏まえた判断・柔軟なルール | 機械的で例外のない強制 |
| **苦手なこと** | 100%の遵守保証 | 文脈に応じた柔軟な判断 |
| **設定コスト** | テキストを書くだけ | JSONとシェルコマンドの知識が必要 |

**使い分けの原則**:
- 「絶対に破ってはいけないルール」 → **フック**（安全ガード、自動フォーマット）
- 「文脈に応じて判断してほしいこと」 → **CLAUDE.md**（コーディング規約、設計方針）

たとえば、「rm -rfを実行しない」はフック向き。「読者に分かりやすい文章を書く」はCLAUDE.md向き。**両方を組み合わせるのがベストプラクティス**です。

---

## 導入時のハマりポイント3つ

### 1. JSONの構文エラーで全設定が無効になる

`settings.json` が壊れると、フックだけでなく**すべての設定が読み込まれなくなります**。編集後は必ずJSONの構文チェックを行いましょう。

```bash
# Pythonで構文チェック（jqがなくても使える）
python -m json.tool ~/.claude/settings.json
```

### 2. `jq` がない環境でフックが動かない

多くの解説記事が `jq` を前提にしていますが、Windows環境ではインストールされていないことが多いです。**Pythonの `json` + `re` モジュールで同等の処理が可能**なので、環境を選ばない書き方を推奨します。

### 3. フックのタイムアウト

デフォルトのタイムアウトは `command` タイプで**600秒**ですが、型チェックのような処理は明示的に短いタイムアウトを設定しておくと安全です。フックが固まっても本体の動作に影響しません。

---

## 私たちへの影響——「設定→放置→結果」という新しい使い方

フックを導入すると、Claude Codeの使い方が変わります。

- **Before**: 毎回「rm -rfは使わないで」と祈る → 手動でtsc → 手動で通知確認
- **After**: 一度設定すれば、自動ブロック → 自動型チェック → 自動通知

> **フックの本質は、「AIへのお願い」を「プログラムによる保証」に昇格させること。** 一度設定すれば、あなたが何もしなくても、毎回確実に実行されます。

まず今日やることは1つだけ。`~/.claude/settings.json` を開いて、危険コマンドブロックのフックを追加する。設定は5分、効果は永続です。

---

## 関連記事

- [Claude Codeの「フック」公式ドキュメント（Anthropic）](https://docs.anthropic.com/en/docs/claude-code/hooks)
- [Claude Codeの設定ファイル公式ドキュメント（Anthropic）](https://docs.anthropic.com/en/docs/claude-code/settings)
