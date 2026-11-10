# ゴイゴ：辞書データ

`dictionary.json` は **JMdict** の読みから作成した派生データです。

- 原データの権利者：Electronic Dictionary Research and Development Group (EDRDG)
- 辞書プロジェクト：Jim Breen により1991年に開始。https://www.edrdg.org/jmdict/j_jmdict.html
- 利用条件：**EDRDGのライセンスと同じ条件**でこの派生データを提供します。https://www.edrdg.org/edrdg/licence.html
- JSON変換：scriptin / jmdict-simplified。https://github.com/scriptin/jmdict-simplified
- 採用リリース：`3.6.2+20261102210542`（辞書の日付 `2026-11-02`）
- 取得元：https://github.com/scriptin/jmdict-simplified/releases/download/3.6.2%2B20261102210542/jmdict-eng-3.6.2+20261102210542.json.tgz
- 元JSONのSHA-256：`dictionary.json` 内の `sourceSha256` に記録。

加工内容：全219,009項目の `kana[].text` を取り出し、NFC正規化とカタカナ→ひらがな変換を実施。ひらがな・長音符のみで2〜7文字の読みを残し、重複を除去して並べ替えました。定義文・訳語・個人名専用のJMnedictは収録していません。**154,728件の読み**があります。ゲームのコードとは別の辞書派生データです。

ゲームはこの公開JSONをネット経由で取得し、収録された読みとの完全一致で判定します。対局中は取得済みの辞書をメモリ内で再利用します。辞書を取得・検証できない場合には敗北にせず、判定前の選択状態に戻ります。一般語・外来語・慣用表現など、JMdictの登録に従います。活用形・別の読み・未収録の人名などを自動生成しません。辞書の更新時期と収録範囲によって、日常語でも登録されていない場合があります。

## 再生成

採用リリースの `.json.tgz` からJSONを展開し、リポジトリ直下で実行します。

```sh
python tools/build-skeleton-dictionary.py /path/to/jmdict-eng-3.6.2+20261102210542.json
```

原典・変換元・ライセンスへのリンクはゲームの [辞書の説明](../../skeleton-sources.html) にも表示しています。
