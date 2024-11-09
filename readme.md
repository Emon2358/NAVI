# 🌐 高機能ウェブスクレイパー

## 📝 概要

このプロジェクトは、Deno で実装された高機能なウェブスクレイピングツールです。掲示板形式のウェブサイトから投稿内容を収集し、解析することができます。

## ✨ 主な機能

- 📊 複数ページの自動スクレイピング
- 💾 JSON ファイルへのデータ永続化
- 🔍 投稿内容の全文検索
- 📈 詳細な統計情報の生成
- 🏷️ 投稿からのタグ自動抽出
- 🔄 リプライチェーンの追跡
- 📱 レスポンシブなエラーハンドリング

## 🚀 インストール方法

### 1. 必要な環境

- Deno 1.31.0 以上
- Node.js 14.0.0 以上（Puppeteer の依存関係のため）

### 2. Deno のインストール

#### Mac の場合

```bash
curl -fsSL https://deno.land/x/install/install.sh | sh
```

#### Windows の場合

```powershell
irm https://deno.land/install.ps1 | iex
```

### 3. プロジェクトのクローン

```bash
git clone [リポジトリURL]
cd [プロジェクトディレクトリ]
```

## 💻 使用方法

### 基本的な実行方法

```bash
deno run --allow-net --allow-read --allow-write --allow-env --allow-run scraper.ts
```

### オプション付きの実行例

```bash
deno run --allow-net --allow-read --allow-write --allow-env --allow-run scraper.ts --url="https://example.com/board/" --output="my_data.json" --pages=5 --search="music"
```

### 📋 コマンドラインオプション

| オプション | 説明                       | デフォルト値                |
| ---------- | -------------------------- | --------------------------- |
| --url      | スクレイピング対象の URL   | https://lainchan.org/music/ |
| --output   | 出力 JSON ファイル名       | scraped_data.json           |
| --pages    | スクレイピングするページ数 | 3                           |
| --search   | 検索クエリ（オプション）   | なし                        |

## 🎯 機能詳細

### 1. 🤖 スクレイピング機能

- 指定された URL から投稿データを収集
- ページネーション対応
- ユーザーエージェントの自動設定
- アクセス間隔の自動調整（2 秒）
- プログレス表示

### 2. 📊 データ収集項目

- 投稿 ID
- 投稿者名
- 投稿内容
- タイムスタンプ
- 画像 URL
- リプライ情報
- 自動抽出タグ

### 3. 💾 データ保存機能

- JSON 形式での永続化
- 増分保存（10 投稿ごと）
- 既存データとの重複チェック
- メタデータの自動付与

### 4. 📈 統計情報

- 総投稿数
- ユニーク投稿者数
- 人気タグランキング
- アクティブスレッド分析
- 時系列データ

### 5. 🔍 検索機能

- 全文検索
- タグベース検索
- 投稿者検索
- 検索結果の自動ソート

## 🛠️ 技術スタック

- 🦕 Deno
- 📦 Puppeteer
- 🌐 DOMParser
- 📝 TypeScript
- 💾 JSON Storage

## 📦 プロジェクト構造

```
.
├── 📄 scraper.ts          # メインスクリプト
├── 📄 scraped_data.json   # 出力データ
└── 📄 README.md           # このファイル
```

## 🔧 カスタマイズ方法

### 1. スクレイピング間隔の調整

```typescript
// scraper.ts内で待機時間を変更
await new Promise((resolve) => setTimeout(resolve, 2000)); // 2000ms = 2秒
```

### 2. タグ抽出パターンの追加

```typescript
const musicPatterns = [
  /#([a-zA-Z0-9]+)/g, // ハッシュタグ
  /\[([^\]]+)\]/g, // 角括弧内
  /"([^"]+)"/g, // 引用符内
  // 新しいパターンをここに追加
];
```

### 3. 出力データのカスタマイズ

```typescript
interface Post {
  id: string;
  author: string;
  content: string;
  imageUrl: string | null;
  timestamp: string;
  replies: string[];
  tags: string[];
  // 新しいフィールドをここに追加
}
```

## ⚠️ 注意事項

1. 🚨 対象サイトのロボット規約を必ず確認してください
2. ⏱️ 適切なアクセス間隔を設定してください
3. 📡 大量のリクエストは避けてください
4. 🔒 個人情報の取り扱いには十分注意してください
5. 💻 サーバーに過度な負荷をかけないようにしてください

## 🐛 トラブルシューティング

### 1. Puppeteer の起動エラー

```bash
PUPPETEER_PRODUCT=chrome deno run -A https://deno.land/x/puppeteer@16.2.0/install.ts
```

### 2. パーミッションエラー

```bash
# すべての必要な権限を付与
deno run --allow-net --allow-read --allow-write --allow-env --allow-run scraper.ts
```

### 3. メモリエラー

- スクレイピングページ数を減らす
- 保存間隔を短くする

## 📈 パフォーマンス最適化

- ✅ インクリメンタルデータ保存
- ✅ メモリ使用量の最適化
- ✅ 非同期処理の効率化
- ✅ エラーリカバリー機能

## 🔜 今後の改善予定

1. 📊 データ可視化機能の追加
2. 🔄 WebSocket 対応
3. 🎨 Web GUI の実装
4. 📱 並列処理の強化
5. 🔍 検索機能の強化

## 📝 ライセンス

MIT ライセンス

## 👥 コントリビューション

1. Fork する
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 🙏 謝辞

- Deno チーム
- Puppeteer チーム
- コントリビューターの皆様

## 📞 サポート

- Issue 作成
- プルリクエスト
- ディスカッション

## 🔄 更新履歴

- 2024-03-xx: 初期バージョンリリース
  - 基本機能の実装
  - データ永続化機能の追加
  - 検索機能の実装
