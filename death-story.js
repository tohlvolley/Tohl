(function(root){'use strict';
const ENTRIES=[
  {
    "id": "intro.wake",
    "category": "導入",
    "label": "目覚め",
    "speaker": "",
    "text": "目を覚ますと、金の装飾に囲まれた部屋にいた。普通の机の前の椅子に座っている。机にはトランプ53枚1組と、一つのサイコロ。ポケットには、前のゲームで使った透明なテープが残っている。"
  },
  {
    "id": "intro.host",
    "category": "導入",
    "label": "参加者との対面",
    "speaker": "霧島",
    "text": "「霧島だ。1回戦のサイコロは、今も持ってる。……DIE、だったな。今回はお前が先攻らしい」"
  },
  {
    "id": "rule.1",
    "category": "ルール",
    "label": "ルール 1",
    "speaker": "GM — ルール説明",
    "text": "「ゲームマスターです。これからルールを説明します。机の上でサイコロを振る。振り終わった後は動かしてはいけない。」"
  },
  {
    "id": "rule.2",
    "category": "ルール",
    "label": "ルール 2",
    "speaker": "GM — ルール説明",
    "text": "「目視できる異なる3面を指定する。辺同士で隣り合う面をつないで選ぶこと。」"
  },
  {
    "id": "rule.3",
    "category": "ルール",
    "label": "ルール 3",
    "speaker": "GM — ルール説明",
    "text": "「選んだ3面の目を合計する。1=A、2=B……26=Z。その数字に対応するアルファベットを1文字与える。」"
  },
  {
    "id": "rule.4",
    "category": "ルール",
    "label": "ルール 4",
    "speaker": "GM — ルール説明",
    "text": "「続いて、最初の3面以外の見える面を3回指定します。同じ面を繰り返して構いません。3回分を選んだあとに確認して確定してください。確定前は取り消せます」"
  },
  {
    "id": "rule.5",
    "category": "ルール",
    "label": "ルール 5",
    "speaker": "GM — ルール説明",
    "text": "「得た4文字と持ち越した文字を使い、机上にある品の英語名を入力してください。複製品を一つ渡します。複数形を指定しても一つです。使った文字は消費し、余りは次の投へ持ち越します。錬成しない選択もできます」"
  },
  {
    "id": "rule.6",
    "category": "ルール",
    "label": "ルール 6",
    "speaker": "GM — ルール説明",
    "text": "「これを六投行い、錬成したカードから5枚を選んでポーカーで対決します。トランプ53枚1組は複製元です。原本をそのまま手札にはできません」"
  },
  {
    "id": "rule.7",
    "category": "ルール",
    "label": "ルール 7",
    "speaker": "GM — ルール説明",
    "text": "「通常のポーカーの役の順で勝敗を決める。5枚未満の手はハイカードより弱い。同じ数字の実物カードを5枚持った時点で、即失格だ。」"
  },
  {
    "id": "intro.end",
    "category": "導入",
    "label": "説明の終わり",
    "speaker": "GM — ルール説明",
    "text": "「説明は以上です。確認したい場合は、卓上の説明用AIにお尋ねください。後攻の方は別室へ。先攻の六投が終わり次第、手番を交代します」"
  },
  {
    "id": "host.start",
    "category": "導入",
    "label": "参加者のひとこと",
    "speaker": "霧島",
    "text": "「先にやってくれ。俺は別室で待ってる。1回戦のサイコロは、ここでも使わせてもらうぞ」\n霧島は自分のサイコロを持ち、待機室へ移った。"
  },
  {
    "id": "inspect.deck",
    "category": "探索",
    "label": "トランプ",
    "speaker": "",
    "text": "机の上にトランプ53枚1組が置かれている。これは複製元で、手札にすることはできない。"
  },
  {
    "id": "inspect.wood",
    "category": "探索",
    "label": "普通の机",
    "speaker": "",
    "text": "重厚な木の机。天板は分厚く、不透明だ。トランプ53枚1組が置かれている。"
  },
  {
    "id": "inspect.glass",
    "category": "探索",
    "label": "透明な机",
    "speaker": "",
    "text": "物を置く天板が透明な机。上からも、下からも向こうが見える。脚は金属製で固定されている。"
  },
  {
    "id": "inspect.shelf",
    "category": "探索",
    "label": "本棚",
    "speaker": "",
    "text": "引き出しに短いメモがあった。「標準のサイコロ。向かい合う面の合計は七。見えるかどうかは、立つ場所で変わる」"
  },
  {
    "id": "inspect.tape",
    "category": "探索",
    "label": "透明なテープ",
    "speaker": "",
    "text": "前のゲームで使った透明なテープ。まだ粘着力がある。"
  },
  {
    "id": "inspect.chair",
    "category": "探索",
    "label": "椅子",
    "speaker": "",
    "text": "厚く張られた革の椅子。動かせば別の角度から机を見られそうだ。"
  },
  {
    "id": "inspect.dice",
    "category": "探索",
    "label": "サイコロ",
    "speaker": "",
    "text": "サイコロを{diceCount}個持っている。各面には1〜6。向かい合う面の和は7。"
  },
  {
    "id": "talk.early",
    "category": "会話",
    "label": "最初の呼びかけ",
    "speaker": "霧島",
    "text": "「あんたも連れて来られたのか。……お互い、ここから出たいもんだな」"
  },
  {
    "id": "talk.later",
    "category": "会話",
    "label": "2投目以降の呼びかけ",
    "speaker": "霧島",
    "text": "「回数は限られてる。お互い、一投ずつ考えるしかないな」"
  },
  {
    "id": "talk.where",
    "category": "会話",
    "label": "ここはどこだ",
    "speaker": "霧島",
    "text": "「俺にも分からない。気が付いたら、この椅子に座らされてたんだ」"
  },
  {
    "id": "talk.gm",
    "category": "会話",
    "label": "錬成を担当するのは？",
    "speaker": "霧島",
    "text": "「説明の確認なら、そこの小さいAIに聞けばいいらしい」"
  },
  {
    "id": "talk.turn",
    "category": "会話",
    "label": "相手の番について",
    "speaker": "霧島",
    "text": "「お前が六投する間、俺は別室で待つ。終わったら交代だ」"
  },
  {
    "id": "gm.alchemy.start",
    "category": "錬成",
    "label": "錬成開始",
    "speaker": "GM — 錬成管理",
    "text": "「錬成を受け付けます。作る品の英語名だけを入力してください」"
  },
  {
    "id": "gm.alchemy.wait",
    "category": "錬成",
    "label": "錬成待機",
    "speaker": "GM — 錬成管理",
    "text": "「ほかに作る品があれば、アイテム名を入力してください。終了する場合はボタンでお知らせください」"
  },
  {
    "id": "opponent.0",
    "category": "相手の手番",
    "label": "手番開始",
    "speaker": "霧島 — 手番開始",
    "text": "待機室の扉が開き、霧島が戻ってきた。\n「待たされたな。透明な机なら、下の面まで見える。おまけに、俺には1回戦のサイコロがある」\n支給された一個と持ち越した一個。二個を並べ、勝ち誇ったように笑った。"
  },
  {
    "id": "opponent.1",
    "category": "相手の手番",
    "label": "第1投",
    "speaker": "霧島 — 第1投",
    "text": "霧島の第1投。透明な机で二個を振り、見える面から文字を選んだ。\n「この机が肝だ。二個あれば、選びようも増える」"
  },
  {
    "id": "opponent.2",
    "category": "相手の手番",
    "label": "第2投",
    "speaker": "霧島 — 第2投",
    "text": "第2投。霧島は一方のサイコロから連なる面を取り、もう一方から追加の文字を得た。"
  },
  {
    "id": "opponent.3",
    "category": "相手の手番",
    "label": "第3投",
    "speaker": "霧島 — 第3投",
    "text": "第3投。霧島の手元に、同じランクのカードが増えていく。使っているサイコロは、最初から二個のままだ。"
  },
  {
    "id": "opponent.4",
    "category": "相手の手番",
    "label": "第4投",
    "speaker": "霧島 — 第4投",
    "text": "第4投。霧島は温存していた文字も使い、最後の一枚を錬成した。\n「これで十分だろう」"
  },
  {
    "id": "opponent.5",
    "category": "相手の手番",
    "label": "第5投",
    "speaker": "霧島 — 第5投",
    "text": "第5投。残った文字を確かめながら、霧島は二個をもう一度振った。"
  },
  {
    "id": "opponent.end",
    "category": "相手の手番",
    "label": "6投の終了",
    "speaker": "霧島",
    "text": "第6投が終わった。霧島は二個のサイコロを脇へ寄せる。\n「透明な机と、持ち越した一個。使えるものは使う。それだけだ」"
  },
  {
    "id": "gm.final",
    "category": "対決・結末",
    "label": "手札選択",
    "speaker": "GM — 進行管理",
    "text": "「六投、終了。勝負に使う5枚を選択してください」"
  },
  {
    "id": "ending.win",
    "category": "対決・結末",
    "label": "勝利",
    "speaker": "GM — 判定",
    "text": "勝利が告げられた。\n自分の錬成品と、霧島が1回戦から持ち越したサイコロを受け取り、次の会場へ進む。"
  },
  {
    "id": "ending.lose",
    "category": "対決・結末",
    "label": "敗北",
    "speaker": "GM — 判定",
    "text": "敗北が告げられた。係員が両脇に立つ。\n連れていかれる先は、地下だった。"
  },
  {
    "id": "ending.draw",
    "category": "対決・結末",
    "label": "引き分け",
    "speaker": "GM — 判定",
    "text": "引き分け。決着は保留された。"
  },
  {
    "id": "ending.disqualified",
    "category": "対決・結末",
    "label": "失格",
    "speaker": "GM — 判定",
    "text": "失格が告げられた。係員に促され、地下へ続く通路を歩かされる。"
  },
  {
    "id": "door.open",
    "category": "対決・結末",
    "label": "扉の外",
    "speaker": "",
    "text": "ここは後攻が待機する別室への扉だ。勝敗と開閉は関係しない。"
  },
  {
    "id": "door.locked",
    "category": "探索",
    "label": "閉ざされた扉",
    "speaker": "",
    "text": "扉の向こうは、後攻の待機室だ。霧島は自分の手番が来るまで、そこで待っている。"
  },
  {
    "id": "rule.8",
    "category": "ルール",
    "label": "ルール 8：複製元の選択",
    "speaker": "GM — ルール説明",
    "text": "「指定した単語だけでは複製元が一つに絞れない場合、候補から一つを選んでください。選択を確定するまで文字は消費しません」"
  },
  {
    "id": "rule.9",
    "category": "ルール",
    "label": "ルール 9：手番と敗北",
    "speaker": "GM — ルール説明",
    "text": "「後攻は別室で待機し、先攻の六投が終わってから手番を行います。敗者と失格者は地下へ移送します。勝者は自分の錬成品と相手の1回戦の持ち物を受け取り、第三回戦へ進みます」"
  },
  {
    "id": "ai.intro",
    "category": "卓上AI",
    "label": "AIの自己紹介",
    "speaker": "卓上AI",
    "text": "私は第二回戦のルールと操作をご案内する、卓上説明用AIです。勝負の判定を変えたり、正解を代わりに選ぶことはできませんが、進め方の確認をお手伝いします。"
  },
  {
    "id": "ai.question",
    "category": "卓上AI",
    "label": "AIへの質問",
    "speaker": "卓上AI",
    "text": "何を聞きたいですか？"
  }
];

const PREVIOUS={"intro.host": {"speaker": "霧島 — ゲームの主", "text": "「ようこそ。俺は霧島。この部屋の主であり、お前の対戦相手だ。これから行うゲームを説明しよう」"}, "rule.1": {"speaker": "霧島 — ゲームの主", "text": "「机の上でサイコロを振る。振り終わった後は動かしてはいけない。」"}, "rule.2": {"speaker": "霧島 — ゲームの主", "text": "「目視できる異なる3面を指定する。辺同士で隣り合う面をつないで選ぶこと。」"}, "rule.3": {"speaker": "霧島 — ゲームの主", "text": "「選んだ3面の目を合計する。1=A、2=B……26=Z。その数字に対応するアルファベットを1文字与える。」"}, "rule.4": {"speaker": "霧島 — ゲームの主", "text": "「続いて、先に指定した3面以外の見える面を3回指定する。同じ面を繰り返してもいい。それぞれの目の数字から、さらに1文字ずつ得られる。」"}, "rule.5": {"speaker": "霧島 — ゲームの主", "text": "「得た4文字と、持ち越した文字を組み合わせ、机の上にある品の英語名を作る。GMがその品の複製を渡す。1回に複数の品を作っても、作らなくてもいい。複数形でも1語につき1個だ。使った文字はなくなる。」"}, "rule.6": {"speaker": "霧島 — ゲームの主", "text": "「これを6回行い、錬成したカードから5枚を選んでポーカーで対決する。机の上にはトランプ53枚1組がある。これは複製元であり、そのまま手札にはできない。自分の6回が終わったら、相手が6回行う。」"}, "rule.7": {"speaker": "霧島 — ゲームの主", "text": "「通常のポーカーの役の順で勝敗を決める。5枚未満の手はハイカードより弱い。同じ数字の実物カードを5枚持った時点で、即失格だ。」"}, "intro.end": {"speaker": "霧島 — ゲームの主", "text": "「説明は以上だ。ルールはいつでも読み返せる。では、目の前のサイコロを振れ。お前から6回だ」"}, "host.start": {"speaker": "霧島 — ゲームの主", "text": "「では、サイコロを振れ」"}, "talk.early": {"speaker": "霧島 — ゲームの主", "text": "「この部屋では、俺が相手をする。準備は自分の目で確かめるんだ」"}, "talk.later": {"speaker": "霧島 — ゲームの主", "text": "「回数は限られている。次の一投をどう使う？」"}, "talk.where": {"speaker": "霧島 — ゲームの主", "text": "「俺が用意した勝負の部屋だ。扉を開ける条件は、俺に勝つこと」"}, "talk.gm": {"speaker": "霧島 — ゲームの主", "text": "「品の複製を管理するのは別のGMだ。面を指定し終えたら、そちらの指示を聞け」"}, "talk.turn": {"speaker": "霧島 — ゲームの主", "text": "「お前の6回が終わってから、俺が6回やる。焦らず続けろ」"}};
const RECENT={"intro.wake": {"speaker": "", "text": "目を覚ますと、金の装飾に囲まれた部屋にいた。普通の机の前の椅子に座っている。机にはトランプ53枚1組と、一つのサイコロ。ポケットには、前のゲームで使った透明なテープが残っている。"}, "intro.host": {"speaker": "霧島", "text": "「霧島だ。……俺も気が付いたらここにいた。あんたも、ここの参加者か？」"}, "rule.1": {"speaker": "GM — ルール説明", "text": "「ゲームマスターです。これからルールを説明します。机の上でサイコロを振る。振り終わった後は動かしてはいけない。」"}, "rule.2": {"speaker": "GM — ルール説明", "text": "「目視できる異なる3面を指定する。辺同士で隣り合う面をつないで選ぶこと。」"}, "rule.3": {"speaker": "GM — ルール説明", "text": "「選んだ3面の目を合計する。1=A、2=B……26=Z。その数字に対応するアルファベットを1文字与える。」"}, "rule.4": {"speaker": "GM — ルール説明", "text": "「続いて、先に指定した3面以外の見える面を3回指定する。同じ面を繰り返してもいい。それぞれの目の数字から、さらに1文字ずつ得られる。」"}, "rule.5": {"speaker": "GM — ルール説明", "text": "「得た4文字と、持ち越した文字を組み合わせ、机の上にある品の英語名を作る。GMがその品の複製を渡す。1回に複数の品を作っても、作らなくてもいい。複数形でも1語につき1個だ。使った文字はなくなる。」"}, "rule.6": {"speaker": "GM — ルール説明", "text": "「これを6回行い、錬成したカードから5枚を選んでポーカーで対決する。机の上にはトランプ53枚1組がある。これは複製元であり、そのまま手札にはできない。自分の6回が終わったら、相手が6回行う。」"}, "rule.7": {"speaker": "GM — ルール説明", "text": "「通常のポーカーの役の順で勝敗を決める。5枚未満の手はハイカードより弱い。同じ数字の実物カードを5枚持った時点で、即失格だ。」"}, "intro.end": {"speaker": "GM — ルール説明", "text": "「説明は以上です。ルールはいつでも読み返せます。では、先攻の方からサイコロを振ってください」"}, "host.start": {"speaker": "霧島", "text": "「……やるしかなさそうだな。先にどうぞ」"}, "inspect.deck": {"speaker": "", "text": "机の上にトランプ53枚1組が置かれている。これは複製元で、手札にすることはできない。"}, "inspect.wood": {"speaker": "", "text": "重厚な木の机。天板は分厚く、不透明だ。トランプ53枚1組が置かれている。"}, "inspect.glass": {"speaker": "", "text": "物を置く天板が透明な机。上からも、下からも向こうが見える。脚は金属製で固定されている。"}, "inspect.shelf": {"speaker": "", "text": "引き出しに短いメモがあった。「標準のサイコロ。向かい合う面の合計は七。見えるかどうかは、立つ場所で変わる」"}, "inspect.tape": {"speaker": "", "text": "前のゲームで使った透明なテープ。まだ粘着力がある。"}, "inspect.chair": {"speaker": "", "text": "厚く張られた革の椅子。動かせば別の角度から机を見られそうだ。"}, "inspect.dice": {"speaker": "", "text": "サイコロを{diceCount}個持っている。各面には1〜6。向かい合う面の和は7。"}, "talk.early": {"speaker": "霧島", "text": "「あんたも連れて来られたのか。……お互い、ここから出たいもんだな」"}, "talk.later": {"speaker": "霧島", "text": "「回数は限られてる。お互い、一投ずつ考えるしかないな」"}, "talk.where": {"speaker": "霧島", "text": "「俺にも分からない。気が付いたら、この椅子に座らされてたんだ」"}, "talk.gm": {"speaker": "霧島", "text": "「右のモニターに出るGMだろう。俺も、さっき聞いたことしか知らない」"}, "talk.turn": {"speaker": "霧島", "text": "「GMの説明だと、あんたが6回やってから俺の6回だ。先攻と後攻を決めたのも、あいつらだよ」"}, "gm.alchemy.start": {"speaker": "GM — 錬成管理", "text": "「文字の付与を確認。錬成を開始します。作る品の名前を指示してください。作らずに終了することもできます」"}, "gm.alchemy.wait": {"speaker": "GM — 錬成管理", "text": "「錬成を受け付けています。残った文字は次の回へ持ち越せます」"}, "opponent.0": {"speaker": "霧島 — 手番開始", "text": "「次は俺の6投だ」霧島は席を立ち、透明な天板の机へ向かった。"}, "opponent.1": {"speaker": "霧島 — 第1投", "text": "霧島は透明な天板の下を覗き込み、面を指定する。「見える面を増やす。これこそ、このゲームの肝だ」"}, "opponent.2": {"speaker": "霧島 — 第2投", "text": "第2投。霧島は同じ手順で錬成を行い、サイコロを増やしていく。"}, "opponent.3": {"speaker": "霧島 — 第3投", "text": "第3投。透明な机を使い、霧島はカードを1枚錬成した。"}, "opponent.4": {"speaker": "霧島 — 第4投", "text": "第4投。底面まで確かめながら、霧島は迷いなく文字を選び取る。"}, "opponent.5": {"speaker": "霧島 — 第5投", "text": "第5投。「仕組みが分かれば、難しいことはない」カードが机に重なった。"}, "opponent.end": {"speaker": "霧島", "text": "「俺の6投も終わった。勝負といこう」霧島は5枚のカードを机に伏せた。"}, "gm.final": {"speaker": "GM — 進行管理", "text": "「六投、終了。勝負に使う5枚を選択してください」"}, "ending.win": {"speaker": "GM — 判定", "text": "勝利。正面の扉のロックが外れた。"}, "ending.lose": {"speaker": "GM — 判定", "text": "敗北。扉のランプが赤く変わった。"}, "ending.draw": {"speaker": "GM — 判定", "text": "引き分け。決着は保留された。"}, "ending.disqualified": {"speaker": "GM — 判定", "text": "同じ数字の実物カードを5枚所持した。規定違反により失格。"}, "door.open": {"speaker": "", "text": "ロックが外れた。霧島は自分の手を見つめたまま、何も言わない。透明なテープをポケットへ戻し、最初の扉を開ける。廊下の先には、次の部屋の灯りが見える。"}, "door.locked": {"speaker": "", "text": "扉は固く閉ざされている。勝者が決まるまでは開かない。"}};
const MAX_SCENES=100;
const KEY='sixth-cast-story-v1',INDEX=new Map(ENTRIES.map(e=>[e.id,e]));
const clone=x=>JSON.parse(JSON.stringify(x));
function defaults(){return{format:'sixth-cast-story',version:1,speed:32,deleted:[],scenes:[],lines:Object.fromEntries(ENTRIES.map(e=>[e.id,{speaker:e.speaker,text:e.text}]))};}
function validLine(value){if(!value||typeof value.speaker!=='string'||value.speaker.length>80||typeof value.text!=='string'||value.text.length>4000||!value.text.trim())throw Error('話者は80文字以内、本文は1〜4000文字で入力してください。');for(const m of value.text.matchAll(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g))if(!['diceCount','round'].includes(m[1]))throw Error('使用できる差し込みは {diceCount} と {round} です。');return{speaker:value.speaker,text:value.text};}
function entries(project){return[...ENTRIES,...(project.scenes||[]).map(e=>({...e,category:'追加した場面'}))];}
function entry(project,id){return INDEX.get(id)||(project.scenes||[]).find(e=>e.id===id);}
function validate(raw){if(!raw||raw.format!=='sixth-cast-story'||raw.version!==1||!Number.isInteger(raw.speed)||raw.speed<0||raw.speed>100||!raw.lines||typeof raw.lines!=='object'||Array.isArray(raw.lines))throw Error('対応するセリフJSONを選んでください。');const result=defaults();if(raw.deleted!==undefined&&(!Array.isArray(raw.deleted)||raw.deleted.length>ENTRIES.length||raw.deleted.some(id=>!INDEX.has(id))||new Set(raw.deleted).size!==raw.deleted.length))throw Error('削除した場面の設定が不正です。');result.deleted=[...(raw.deleted||[])];const custom=raw.scenes===undefined?[]:raw.scenes;if(!Array.isArray(custom)||custom.length>MAX_SCENES)throw Error('追加できる場面は100個までです。');const ids=new Set(INDEX.keys());for(const scene of custom){if(!scene||typeof scene.id!=='string'||!/^custom\.[a-z0-9_-]{1,64}$/.test(scene.id)||ids.has(scene.id)||typeof scene.label!=='string'||!scene.label.trim()||scene.label.length>80||typeof scene.anchor!=='string'||!['before','after'].includes(scene.position))throw Error('場面の名前・表示タイミングを確認してください。');ids.add(scene.id);result.scenes.push({id:scene.id,label:scene.label,anchor:scene.anchor,position:scene.position});}for(const scene of result.scenes){let current=scene;const path=new Set();while(current){if(path.has(current.id))throw Error('場面の表示順が循環しています。');path.add(current.id);if(!ids.has(current.anchor))throw Error('表示タイミングに指定した場面がありません。');current=result.scenes.find(e=>e.id===current.anchor);}}if(Object.keys(raw.lines).length>ids.size)throw Error('場面数が不正です。');let total=0;for(const[id,value]of Object.entries(raw.lines)){if(!ids.has(id))throw Error('対応していない場面が含まれています。');const first=validLine(value);if(value.follow!==undefined&&(!Array.isArray(value.follow)||value.follow.length>49))throw Error('1場面につきセリフは50個まで追加できます。');const extra=(value.follow||[]).map(validLine);total+=first.text.length+extra.reduce((n,p)=>n+p.text.length,0);if(total>200000)throw Error('セリフ全体は20万文字以内にしてください。');const previous=PREVIOUS[id],updated=INDEX.get(id),recent=RECENT[id];if(recent&&first.text===recent.text)first.text=updated.text;if(recent&&first.speaker===recent.speaker)first.speaker=updated.speaker;if(previous&&first.speaker===previous.speaker)first.speaker=updated.speaker;if(previous&&first.text===previous.text)first.text=updated.text;result.lines[id]={...first,...(extra.length?{follow:extra}:{})};}for(const scene of result.scenes)if(!result.lines[scene.id])throw Error('追加した場面のセリフがありません。');result.speed=raw.speed;return result;}
function plan(project,id){if(!entry(project,id))throw Error('場面が見つかりません。');const result=[],path=new Set();function visit(key){if(path.has(key))throw Error('場面の表示順が循環しています。');path.add(key);for(const scene of project.scenes||[])if(scene.anchor===key&&scene.position==='before')visit(scene.id);if(!(project.deleted||[]).includes(key))result.push(key);for(const scene of project.scenes||[])if(scene.anchor===key&&scene.position==='after')visit(scene.id);path.delete(key);}visit(id);return result;}
function canAnchor(project,id,anchor){if(!entry(project,anchor))return false;const seen=new Set([id]);let current=anchor;while(current){if(seen.has(current))return false;seen.add(current);current=(project.scenes||[]).find(e=>e.id===current)?.anchor;}return true;}
function addScene(project,anchor){if(!entry(project,anchor)||(project.scenes||[]).length>=MAX_SCENES)throw Error('これ以上場面を追加できません。');project.scenes??=[];let id;do{id='custom.'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10);}while(entry(project,id));project.scenes.push({id,label:'新しい場面',anchor,position:'after'});project.lines[id]={speaker:'',text:'新しい場面のセリフ'};return id;}
function removeScene(project,id){const scene=(project.scenes||[]).find(e=>e.id===id);if(!scene){if(!INDEX.has(id))throw Error('場面が見つかりません。');project.deleted=[...new Set([...(project.deleted||[]),id])];return id;}const order=new Map(ENTRIES.flatMap(e=>plan(project,e.id)).map((key,i)=>[key,i]));for(const child of project.scenes)if(child.anchor===id){child.anchor=scene.anchor;child.position=scene.position;}project.scenes=project.scenes.filter(e=>e.id!==id).sort((a,b)=>order.get(a.id)-order.get(b.id));delete project.lines[id];return scene.anchor;}
function moveScene(project,id,direction){const scene=(project.scenes||[]).find(e=>e.id===id);if(!scene)throw Error('追加した場面を選んでください。');const peers=project.scenes.filter(e=>e.anchor===scene.anchor&&e.position===scene.position),index=peers.findIndex(e=>e.id===id),other=peers[index+direction];if(!other)throw Error('これ以上移動できません。');const a=project.scenes.indexOf(scene),b=project.scenes.indexOf(other);[project.scenes[a],project.scenes[b]]=[project.scenes[b],project.scenes[a]];}
function pages(project,id){const value=project.lines[id]||entry(project,id);if(!value)throw Error('場面が見つかりません。');return[{speaker:value.speaker,text:value.text},...(value.follow||[]).map(p=>({speaker:p.speaker,text:p.text}))];}
function setPages(project,id,values){if(!entry(project,id)||!Array.isArray(values)||values.length<1||values.length>50)throw Error('1場面のセリフは1〜50個にしてください。');const copy=values.map(p=>({speaker:p.speaker,text:p.text}));project.lines[id]={...copy[0],...(copy.length>1?{follow:copy.slice(1)}:{})};return project;}
function insertPage(project,id,after,value){const list=pages(project,id);if(!Number.isInteger(after)||after<0||after>=list.length||list.length>=50)throw Error('これ以上セリフを追加できません。');list.splice(after+1,0,{speaker:value.speaker,text:value.text});setPages(project,id,list);return after+1;}
function movePage(project,id,from,to){const list=pages(project,id);if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=list.length||to>=list.length)throw Error('移動先のセリフが見つかりません。');list.splice(to,0,list.splice(from,1)[0]);setPages(project,id,list);return to;}
function removePage(project,id,index){const list=pages(project,id);if(!Number.isInteger(index)||index<0||index>=list.length||list.length<=1)throw Error('場面にはセリフを1つ以上残してください。');list.splice(index,1);setPages(project,id,list);return Math.min(index,list.length-1);}
function format(value,vars){return{speaker:value.speaker,text:value.text.replace(/\{(diceCount|round)\}/g,(all,key)=>vars[key]===undefined?all:String(vars[key]))};}
function line(project,id,vars={}){return format(pages(project,id)[0],vars);}
function sequence(project,id,vars={}){return pages(project,id).map(value=>format(value,vars));}
class Store{constructor(storage){this.storage=storage;this.project=defaults();try{const raw=storage?.getItem(KEY);if(raw&&raw.length<1000000)this.project=validate(JSON.parse(raw));}catch{}}draft(){return clone(this.project);}save(raw){const value=validate(raw);if(this.storage)this.storage.setItem(KEY,JSON.stringify(value));this.project=value;return this.draft();}get(id,vars){return line(this.project,id,vars);}sequence(id,vars){return sequence(this.project,id,vars);}}
class Reveal{constructor(){this.timer=null;this.typing=false;this.serial=0;this.units=[];this.write=()=>{};this.done=()=>{};}cancel(){clearTimeout(this.timer);this.serial++;this.typing=false;}start(text,speed,write,done=()=>{}){this.cancel();this.write=write;this.done=done;this.full=String(text);this.units=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('ja',{granularity:'grapheme'}).segment(this.full)].map(s=>s.segment):Array.from(this.full);this.index=0;this.typing=this.units.length>0&&speed>0;const serial=this.serial;if(!this.typing){write(this.full);done();return;}write('');const tick=()=>{if(serial!==this.serial)return;this.index++;write(this.units.slice(0,this.index).join(''));if(this.index>=this.units.length){this.typing=false;this.done();}else this.timer=setTimeout(tick,speed);};this.timer=setTimeout(tick,speed);}finish(){if(!this.typing)return false;clearTimeout(this.timer);this.serial++;this.typing=false;this.index=this.units.length;this.write(this.full);this.done();return true;}}
function turnLocked(phase,rolling=false){return rolling||['trio','bonus','alchemy'].includes(phase);}
function allowedCommand(phase,type){return !turnLocked(phase)||(phase==='alchemy'?['forge','end','move'].includes(type):['faces','move'].includes(type));}
const api={ENTRIES,KEY,MAX_SCENES,entries,entry,plan,canAnchor,addScene,removeScene,moveScene,defaults,validate,line,pages,setPages,insertPage,movePage,removePage,sequence,Store,Reveal,turnLocked,allowedCommand};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SixthStory=api;
})(typeof window!=='undefined'?window:globalThis);
