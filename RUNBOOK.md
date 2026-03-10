# P1: AIブログ＋偉人の言葉 RUNBOOK

## コンセプト
- AI・技術ニュースを分かりやすく解説 ＋ 偉人の名言でビジネスの悩みに答える
- 既存の「AI比較ラボ」（ai-navi-tools.com）を継続運用
- 将来的にはAIツール推薦＋偉人名言チャットボットでメンバーシップ化

## 現状
- プロジェクトパス: `C:\Users\hirok\blogs\ai-blog`
- GitHubリポジトリ: https://github.com/TOshirai-hiroki/income-blog.git
- 公開URL: https://ai-navi-tools.com
- 記事数: 20本（全てリライト済み）
- AdSense: 承認待ち（ca-pub-2016529992214438）

## カテゴリ

### 1. AIツール記事（既存）
テクノロジーに関するニュースを週2回リサーチし、キュレーションした内容をAIで記事化

### 2. 偉人の言葉（新規）
歴史上の偉人の名言をAIで調査・執筆。ビジネスの悩みと結びつけて現代的な解釈を提供

---

## 記事作成フロー

### AIツール記事

#### Step 1: ニュース・データを配置
`C:\Users\hirok\blogs\input\ai\YYYY-MM-DD\` に以下を配置：
- gensparkでリサーチしたニュースURL・サマリー
- 自分のコメントやメモ（任意）

#### Step 2: Claude Codeで記事生成
1. inputフォルダ内のデータを読み取り
2. 独自の切り口で記事を構成（比較、初心者向け解説、活用方法など）
3. 関連するアフィリエイトリンクを設置
4. `ai-blog/src/content/blog/` に記事ファイルを配置
5. ユーザーが確認・編集（スタイル学習のため重要）
6. git commit & push → Cloudflare自動デプロイ

### 偉人の言葉記事

#### Step 1: テーマを指定
`C:\Users\hirok\blogs\input\ai\YYYY-MM-DD\` にテンプレートに沿って配置：
- 取り上げたい偉人名（または「おまかせ」）
- ビジネスの悩みやテーマ（例：「リーダーシップ」「失敗からの回復」）
- 自分のコメント（任意）

#### Step 2: Claude Codeで記事生成
1. 偉人の経歴・名言をAIが調査
2. ビジネスの悩みと名言を結びつけた記事を構成
3. 関連するAIツールがあれば提案を含める
4. `ai-blog/src/content/blog/` に記事ファイルを配置
5. ユーザーが確認・編集
6. git commit & push → Cloudflare自動デプロイ

---

## 広告戦略

### AdSense
- 審査結果待ち
- 承認後、AdBanner.astroのコメント解除で有効化

### アフィリエイト（設置済み）
| 案件 | 設置記事 | ASP |
|------|---------|-----|
| ConoHa AI Canvas | midjourney, dall-e-3, best-ai-image-generators | A8.net |
| Value AI Writer | copilot-ai-writing-tools | A8.net |
| A8.net登録誘導 | affiliate-marketing-beginners | A8.net |
| 楽天市場 | ai-side-business-ideas, blog-monetization-guide | 楽天 |
| Amazon（もしも経由） | ai-programming-learning, stable-diffusion-local-setup, blog-monetization-guide, seo-basics-for-beginners | もしもアフィリエイト |

### もしもアフィリエイト Amazon リンク情報（2026-03-10承認）
- **a_id**: 5410316
- **リンクテンプレート**:
```html
<a href="//af.moshimo.com/af/c/click?a_id=5410316&p_id=170&pc_id=185&pl_id=4161" rel="nofollow" referrerpolicy="no-referrer-when-downgrade" attributionsrc>（自由テキスト）</a><img src="//i.moshimo.com/af/i/impression?a_id=5410316&p_id=170&pc_id=185&pl_id=4161" width="1" height="1" style="border:none;" loading="lazy">
```

### 将来構想
- 偉人名言×AIチャットボット → メンバーシップ化（Month 9以降検討）
- ビジネスの悩み入力→名言＋AIツール提案

---

## 更新頻度
- 週2本（AIニュース1本 + 偉人の言葉1本）
- 既存20記事のメンテナンス（情報更新）も含む

---

## KPI
- 月間PV: Search Console/Cloudflare Analyticsで追跡
- アフィリエイトCVR: A8.net管理画面で確認
- AdSense収益: Google AdSense管理画面で確認
- 記事投稿数: 月8〜10本目標
