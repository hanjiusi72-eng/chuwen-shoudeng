/* 除瘟守灯 · 数据配置（药名与药方取自 AI 设计稿；仅为游戏内配方，不作现实用药建议） */
const HERBS = [
  { id: 'bohe', name: '薄荷' }, { id: 'maidong', name: '麦冬' }, { id: 'renshen', name: '人参' },
  { id: 'fuling', name: '茯苓' }, { id: 'zisu', name: '紫苏' }, { id: 'lianqiao', name: '连翘' },
  { id: 'banxia', name: '半夏' }, { id: 'jinyinhua', name: '金银花' }, { id: 'chenpi', name: '陈皮' },
  { id: 'gancao', name: '甘草' }, { id: 'juhua', name: '菊花' }, { id: 'huoxiang', name: '藿香' }
];
const HERB = Object.fromEntries(HERBS.map(h => [h.id, h]));

/* 药书页（循环翻页）；R1/R2 用于交互 1，E1-E3 用于交互 2B */
const RECIPES = [
  { id: 'R1', name: '舒喉化骨汤', tag: '治虎', desc: ['喉中鲠物', '吞咽作痛'], herbs: ['gancao', 'bohe', 'chenpi'], color: 0xffb347 },
  { id: 'R2', name: '菊花明目饮', tag: '医龙', desc: ['双目昏花', '红肿畏光'], herbs: ['juhua', 'jinyinhua', 'gancao'], color: 0x7fe0c8 },
  { id: 'E1', name: '银翘散', tag: '清热', desc: ['发热头痛', '咽喉肿痛'], herbs: ['jinyinhua', 'lianqiao', 'bohe', 'gancao'], color: 0xff6a6a },
  { id: 'E2', name: '麦门冬汤', tag: '润喉', desc: ['咳嗽气喘', '咽干口燥'], herbs: ['maidong', 'banxia', 'renshen', 'gancao'], color: 0x6ab0ff },
  { id: 'E3', name: '藿香正气散', tag: '化湿', desc: ['呕吐腹胀', '暑湿困身'], herbs: ['huoxiang', 'zisu', 'chenpi', 'fuling'], color: 0x9be36a }
];
const RECIPE = Object.fromEntries(RECIPES.map(r => [r.id, r]));

const EFFECT_TASKS = [
  { id: 'E1', who: 'tiger',  hint: '准备能帮助缓解发热的药。', short: '缓解发热' },
  { id: 'E2', who: 'dragon', hint: '准备能帮助缓解咳嗽的药。', short: '缓解咳嗽' },
  { id: 'E3', who: 'tiger',  hint: '准备能止住呕吐、腹胀的药。', short: '止呕消胀' }
];

/* 市集六个摊位；need 为采购条目 */
const STALLS = [
  { id: 'herb',   name: '药草摊', goods: '新鲜草药', need: true,  item: '制药草药', info: '这里卖的是各色草药。', color: C.green },
  { id: 'bamboo', name: '竹篾摊', goods: '竹条竹篾', need: true,  item: '柔韧竹篾', info: '这里卖的是能弯成圈的竹篾。', color: C.orange },
  { id: 'paper',  name: '纸铺',   goods: '薄棉纸',   need: true,  item: '灯面棉纸', info: '这里卖的是薄而透光的棉纸。', color: C.cyan },
  { id: 'oil',    name: '油铺',   goods: '灯油灯芯', need: true,  item: '灯油与灯芯', info: '这里卖的是灯油和灯芯。', color: C.red },
  { id: 'food',   name: '食物摊', goods: '热包子',   need: false, info: '这是食物摊，卖的是热包子和米糕，填饱肚子用的，扎灯制药用不上。', color: C.yellow },
  { id: 'misc',   name: '杂货摊', goods: '骰子杂物', need: false, info: '这是杂货摊，卖骰子、针线这些小玩意儿，不是我们要找的。', color: C.purple }
];
const MARKET_HINTS = [
  { id: 'herb',   who: 'dragon', text: '找到卖草药的摊子，把药房需要的药材备齐。' },
  { id: 'bamboo', who: 'tiger',  text: '灯要站得住，要找能弯成圈的竹条。' },
  { id: 'paper',  who: 'dragon', text: '让灯光透出来，要选薄而透光的纸。' },
  { id: 'oil',    who: 'tiger',  text: '灯芯还要配上灯油，才能把这一夜照亮。' }
];

const BLESSINGS = [
  { id: 'b1', text: '平安康健' }, { id: 'b2', text: '同心守望' }, { id: 'b3', text: '岁岁安宁' }
];

/* 守灯参数（PRD 9.11） */
const NIGHT = {
  duration: 60, rescueHold: 2, deadline: 10, guideRadius: 100,
  spawnEarly: 4, spawnLate: 2.5, ghostMax: 4, ghostSpeed: 70,
  drumMin: 12, drumMax: 16, drumLife: 5, drumRadius: 160,
  rainCooldown: 8, rainRadius: 110, fogEvery: [14, 18], fogWarn: 2
};

/* 幕间界面（按设计稿：序幕底纹 + 带网点分身的人物 + 竖排诗句 + 「第X幕」） */
const ACTS = {
  1: { title: '第一幕', sub: '醫龍治虎', fig: 'fig_tiger', poem: ['懸壺白礁濟蒼生，', '一爐藥火照龍虎。'], next: ['Medicine', { mode: 'tiger' }] },
  2: { title: '第二幕', sub: '入村製藥', fig: 'fig_carp', poem: ['市聲裡尋藥與竹，', '一盞素燈照萬家。'], next: ['Market'] },
  3: { title: '第三幕', sub: '守燈驅瘟', fig: 'wenshen', poem: ['瘟神夜至風吹燈，', '鼓響龍吟守天明。'], next: ['Defense'] },
  4: { title: '第四幕', sub: '畫燈題字', fig: 'fig_dragon', poem: ['筆底龍虎生紋彩，', '燈前吉語寄平安。'], next: ['Decorate'] }
};
