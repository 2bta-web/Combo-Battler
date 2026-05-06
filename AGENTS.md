# AGENTS.md

## 慣習

日本語で回答
知識がない人にでも分かりやすく説明

## プロジェクト

- **形式**: ブラウザゲーム（HTML/CSS/JS分割）
- **起動**: `index.html` をブラウザで開くだけで動く（サーバー不要）
- **JS読み込み順（重要）**: enemy → combo → ui → audio → particles → targets → phase → game
- **構成**:
  - `index.html` - エントリポイント
  - `css/style.css` - 全スタイル（shake/flash/particle/judgment含む）
  - `js/game.js` - メインロジック、状態管理、ハイスコア(localStorage)
  - `js/enemy.js` - 敵HP管理、ダメポップ
  - `js/targets.js` - OSU風ターゲット（判定精度・複数同時出現対応）
  - `js/combo.js` - コンボ・倍率・アップグレード15種
  - `js/phase.js` - フェーズ進行・選択肢UI
  - `js/ui.js` - 情報バー・ログ・テキストボックス更新
  - `js/audio.js` - Web Audio API による効果音（ファイル不要）
  - `js/particles.js` - DOMパーティクルエフェクト

## ゲーム仕様

- **判定**: Perfect(×1.5) / Good(×1.0) / OK(×0.6) / Early(ダメージ0) — アプローチリング進行度で判定
- **複数ターゲット**: 高フェーズで同時出現（最大3）、600ms間隔で順次出現、被り防止ロジックあり
- **ターゲット色**: 金(スコア1.5倍) / 赤(ダメージ2倍) / 青(通常) がランダム出現
- **15種アップグレード**: 連撃・吸収・エコー・障壁・オーラ を追加
- **Perfectストリーク**: 3連続Perfectでボーナスダメージ
- **フィーバー**: コンボ20で発動、30秒間スコア2倍（60秒クールダウン）
- **ポーズ**: Escapeキーで一時停止（アニメーション・タイマーも停止）
- **ハイスコア**: localStorage('comboBattlerHS') に保存、画面表示あり
- **モード**: Standard(10) / Hard(10,超速) / Endless(∞, リタイア可)
- **コンボ演出**: 5/10/50コンボで画面フラッシュ、雷エフェクト、パーティクル

## 注意点

- 全JSファイルは `type="module"` 非使用、グローバルスコープ依存
- `window.onTargetHit(judgment)`, `window.onTargetMiss()`, `window.onBatchComplete()`, `window.onChoiceSelected()` でモジュール間連携
- 新しいJSファイルを追加する場合は `index.html` の script タグ読み込み順に注意