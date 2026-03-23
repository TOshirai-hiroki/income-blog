---
title: 'Browser Use vs Playwright MCP——AIブラウザ自動化の「速度」と「柔軟性」、どちらを取るか'
description: 'Claude CodeでPlaywright MCPを使ってきた筆者が、新興のBrowser Use MCPを実際に導入・検証。速度は遅いが柔軟性で勝るBrowser Useの実力と使い分けを解説します。'
pubDate: 2026-03-24
category: 'AI自動化'
tags: ['Claude Code', 'Browser Use', 'Playwright', 'MCP', 'AIエージェント', 'ブラウザ自動化', '2026年']
affiliate: false
---

「AIにブラウザを操作させたい」——この需要が急速に高まっています。

Claude CodeやCursorなどのAIコーディングツールでは、**MCP（Model Context Protocol）** を通じてブラウザを操作できますが、選択肢は実質2つ。高速で安定した **Playwright MCP** か、柔軟で賢い **Browser Use** か。

筆者は半年以上Playwright MCPを使ってきましたが、「サムネイル画像のアップロードができない」「UIが変わると動かなくなる」という限界を感じ、Browser Useの導入を検討・実施しました。この記事では、その調査と導入の過程を共有します。

---

## そもそも何が違うのか——設計思想の根本的な差

### Playwright MCP：最短距離で実行するエンジン

Playwright MCPは、ブラウザ操作のための**実行エンジン**です。

```
CSSセレクタを指定 → 要素を見つける → クリック（数十ms）
```

開発者がHTMLの構造を理解し、「このボタンはこのセレクタで取れる」と分かっている場面で最強です。Chrome DevTools Protocol（CDP）経由でブラウザを直接叩くため、1操作あたり数十ミリ秒で完了します。

### Browser Use：画面を見て考えて動くAIレイヤー

Browser Useは、Playwrightの**上に**構築されたAI操作レイヤーです。

```
画面の状態を取得 → 要素を理解 → AIが次の操作を判断 → 実行（数秒）
```

「見る → 考える → 動く」が毎回入るため、1アクションに数秒かかります。しかしその代わり、**セレクタを知らなくても、画面を見て操作できる**のです。

| 比較項目 | Playwright MCP | Browser Use |
|----------|---------------|-------------|
| 設計思想 | 実行エンジン | AI操作レイヤー |
| 操作速度 | 数十ms/操作 | 数秒/操作 |
| セレクタ指定 | 必須 | 不要（インデックス指定） |
| UI変更への耐性 | 低い | 高い |
| 学習コスト | HTML知識が必要 | 自然言語でOK |

> **重要な理解：** この2つは「対立」ではなく「レイヤー違い」です。Browser Useの内部ではPlaywrightが動いています。

---

## ベンチマーク：速度差はどれくらいあるのか

実際に計測された数値を見てみましょう（参考：[ベンチマーク記事](https://zenn.dev/atani/articles/browser-use-vs-playwright-cli-benchmark)）。

### 初回起動時

| | Playwright MCP | Browser Use |
|---|---|---|
| 起動時間 | **2.2秒** | 14.3秒 |
| 差 | — | 約6.5倍遅い |

### 2回目以降（デーモン起動済み）

| 操作 | Playwright MCP | Browser Use | 差 |
|------|---------------|-------------|-----|
| ページ遷移 | 0.13秒 | 3.4秒 | **26倍** |
| DOM取得 | 0.08秒 | 2.0秒 | **25倍** |
| スクリーンショット | 0.11秒 | 0.20秒 | 2倍 |

数字だけ見ると圧倒的にPlaywrightが速いです。しかし、これは「同じタスクを同じ方法で実行した場合」の話。Browser Useの価値は速度ではなく、**Playwrightではそもそもできない操作ができること**にあります。

---

## Playwright MCPの限界——何ができないのか

半年間の運用で感じた限界は明確でした。

### 1. ファイルアップロードが不安定

NOTEやSubstackで記事のサムネイル画像をアップロードする操作は、Playwright MCPでは**実質的にできませんでした**。ファイル選択ダイアログはOSネイティブのUIで、ブラウザのDOMの外にあるためです。

### 2. UIが変わると壊れる

CSSセレクタに依存しているため、サイトのデザイン更新やA/Bテストでセレクタが変わると、スクリプト全体が動かなくなります。

### 3. ログイン状態が保持できない

Cookie の永続化機能がないため、セッションが切れるたびに再ログインが必要です。

---

## Browser Useが解決すること

### セレクタ不要のインデックス操作

Browser Useは画面上の要素にインデックス番号を振り、その番号で操作します。

```
# 画面の状態を取得（要素一覧がインデックス付きで返る）
browser_get_state

# インデックス5の要素をクリック
browser_click(index=5)

# インデックス3の入力欄にテキストを入力
browser_type(index=3, text="記事タイトル")
```

HTMLの構造を知らなくても、「画面に見えているもの」を番号で指定できます。

### ファイルアップロード対応

Browser Useはファイルアップロードに対応しており、サムネイル画像の設定など、Playwright MCPでは困難だった操作が可能になります。

### Cookie管理とプロファイル

```
# Cookieのエクスポート・インポート
browser-use cookies export cookies.json
browser-use cookies import cookies.json

# 既存のChromeプロファイルで起動（ログイン状態を引き継ぎ）
browser-use --profile "Default" open https://note.com
```

ログイン済みの状態をそのまま使えるのは、実務では非常に大きな利点です。

### 最後の手段：AIエージェントモード

Browser UseのMCPには `retry_with_browser_use_agent` という特殊なツールがあります。通常の操作で行き詰まったとき、**自然言語でタスクを説明するだけで、AIが自律的にブラウザを操作してくれる**機能です。

---

## 実際の導入手順

### 前提条件

- Python 3.11以上
- pip（Pythonパッケージマネージャー）

### インストール

```bash
# browser-useパッケージをインストール
pip install browser-use

# Chromiumブラウザをインストール
python -m playwright install chromium
```

### Claude CodeのMCPサーバーとして登録

```bash
# グローバル（全プロジェクト共通）で登録
claude mcp add browser-use -s user \
  -e PYTHONIOENCODING=utf-8 \
  -- /path/to/browser-use --mcp --headed
```

`--headed` をつけると、ブラウザの画面が実際に表示されるので、AIが何をしているか目視で確認できます。

### 接続確認

```bash
claude mcp list
# browser-use: ... ✓ Connected と表示されればOK
```

---

## コストについて——追加費用は基本ゼロ

Browser Useには2つのエディションがあります。

| | OSS版（ローカル） | Cloud版（ホスティング） |
|---|---|---|
| 料金 | **無料** | 有料（トークン課金） |
| ブラウザ | 自分のPCで実行 | クラウド上で実行 |
| CAPTCHA解決 | なし | あり |
| アンチ検出 | なし | あり |
| 用途 | 個人利用・少量の自動化 | 大規模スクレイピング |

Claude Codeと組み合わせる場合、**OSS版で十分**です。「見て→考えて→動く」の「考える」部分はClaude Code自身が担当するため、Browser Use側でLLMを呼ぶ必要がなく、追加のAPI費用はかかりません。

---

## 並列実行は可能か——現状と今後の展望

「複数のブラウザを同時に操作して、作業を並列化できないか？」という疑問は自然に浮かびます。

### Browser Use側の対応状況

Browser Useの公式には、並列実行のサンプルコードが存在します。

```python
# 公式の並列実行パターン（概念）
async def run_parallel():
    results = await asyncio.gather(
        run_task(Browser(user_data_dir="./profile-1"), "タスクA"),
        run_task(Browser(user_data_dir="./profile-2"), "タスクB"),
        run_task(Browser(user_data_dir="./profile-3"), "タスクC"),
    )
```

ポイントは、**各ブラウザに別々の `user_data_dir` を与えて完全に分離する**ことです。同じプロファイルを共有すると競合が発生します。

### 現時点の制約

ただし、いくつかの制約があります。

| 制約 | 詳細 |
|------|------|
| 公式でexperimental | 「agents might conflict each other」と注意書きあり |
| MCP経由のセッション分離が未対応 | 操作系ツールに`session_id`パラメータがない |
| Claude Code側の制約 | 複数セッションが同じChromeタブグループを奪い合う問題が報告されている |

### 将来の構成案

並列化が成熟した際の理想構成は以下のとおりです。

**構成A：Claude Code worktree + 個別Browser**
- Claude Codeのworktreeで複数セッションを分離
- 各セッションが自分専用のBrowser Useインスタンスを持つ
- 各Browserに固有の`user_data_dir`を割り当て

**構成B：CDP接続で分離**
- 複数のChromeインスタンスを別ポートで起動
- 各Browser Useが別々の`cdp_url`に接続

> **現実的な判断：** 並列化の部品は揃いつつありますが、安定性がまだ実験段階です。まずは単体で使い倒し、安定したら並列化を検討するのが賢明です。

---

## 結論：使い分けが最適解

Playwright MCPとBrowser Useは**併用**がベストです。

| 場面 | 推奨ツール | 理由 |
|------|-----------|------|
| 安定したサイトの定型操作 | Playwright MCP | 高速・安定 |
| スクリーンショット撮影 | Playwright MCP | 数十msで完了 |
| サムネイル画像のアップロード | **Browser Use** | ファイルアップロード対応 |
| UIが頻繁に変わるサイト | **Browser Use** | セレクタ不要 |
| ログイン状態の保持が必要 | **Browser Use** | Cookie管理・プロファイル対応 |
| 手順が決まっていない探索的タスク | **Browser Use** | AIが画面を見て判断 |

速度を重視するならPlaywright、柔軟性を重視するならBrowser Use。対立ではなく、**レイヤーの違い**として理解し、場面に応じて使い分けるのが2026年時点での最適解です。

---

## 関連記事

- [AIが"答える"時代は終わった——"操作する"AIエージェントが来る衝撃と怖さ](/blog/ai-agents-era-operate-not-answer)
- [Claude Codeの「フック」で自動化が変わる——プロンプトの"お願い"をシステムの"強制"に昇格させる方法](/blog/claude-code-hooks-automation-guide)
- [Nano Banana 2 / ProのAPIを安く使う方法——サードパーティ中継サービス徹底比較](/blog/nano-banana-api-proxy-guide)
