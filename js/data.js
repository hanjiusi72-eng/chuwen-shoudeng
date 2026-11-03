/* 光亮 · 数据配置（药名与药方取自 AI 设计稿；仅为游戏内配方，不作现实用药建议） */
const HERBS = [
  { id: 'bohe', name: '薄荷' }, { id: 'maidong', name: '麦冬' }, { id: 'renshen', name: '人参' },
  { id: 'fuling', name: '茯苓' }, { id: 'zisu', name: '紫苏' }, { id: 'lianqiao', name: '连翘' },
  { id: 'banxia', name: '半夏' }, { id: 'jinyinhua', name: '金银花' }, { id: 'chenpi', name: '陈皮' },
  { id: 'gancao', name: '甘草' }, { id: 'juhua', name: '菊花' }, { id: 'huoxiang', name: '藿香' }
];
const HERB = Object.fromEntries(HERBS.map(h => [h.id, h]));

/* 药书页（循环翻页）；R1/R2 用于交互 1，E1-E3 用于交互 2B（竹简药单图来自设计稿） */
const RECIPES = [
  { id: 'R1', name: '舒喉化骨汤', tag: '治虎', desc: ['喉中鲠物', '吞咽作痛'], herbs: ['gancao', 'bohe', 'chenpi'], color: 0xffb347 },
  { id: 'R2', name: '菊花明目饮', tag: '医龙', desc: ['双目昏花', '红肿畏光'], herbs: ['juhua', 'jinyinhua', 'gancao'], color: 0x7fe0c8 },
  { id: 'E1', name: '银翘散', tag: '清热', img: 'recipe_heat', desc: ['发热头痛', '咽喉肿痛'], herbs: ['jinyinhua', 'lianqiao', 'bohe', 'gancao'], color: 0xff6a6a },
  { id: 'E2', name: '麦门冬汤', tag: '润喉', img: 'recipe_cough', desc: ['咳嗽气喘', '咽干口燥'], herbs: ['maidong', 'banxia', 'renshen', 'gancao'], color: 0x6ab0ff },
  { id: 'E3', name: '藿香正气散', tag: '化湿', img: 'recipe_damp', desc: ['呕吐腹胀', '暑湿困身'], herbs: ['huoxiang', 'zisu', 'chenpi', 'fuling'], color: 0x9be36a }
];
const RECIPE = Object.fromEntries(RECIPES.map(r => [r.id, r]));

const EFFECT_TASKS = [
  { id: 'E1', who: 'tiger',  hint: '村里有人发热头痛，备一份能清热的药。', short: '缓解发热' },
  { id: 'E2', who: 'dragon', hint: '有人咳得整夜睡不安稳，备一份润喉止咳的药。', short: '缓解咳嗽' },
  { id: 'E3', who: 'tiger',  hint: '还有人上吐下泻……备一份能定住肠胃的药。', short: '止呕消胀' }
];

/* 市集六个摊位；need 为采购条目 */
const STALLS = [
  { id: 'herb',   name: '药草摊', goods: '新鲜草药', need: true,  item: '制药草药', info: '这里是药草摊，带着露水的草药正香呢——制药就缺它。', color: C.green },
  { id: 'bamboo', name: '竹篾摊', goods: '竹条竹篾', need: true,  item: '柔韧竹篾', info: '这里是竹篾摊，竹篾能弯成圈不易断，扎灯骨全靠它。', color: C.orange },
  { id: 'paper',  name: '纸铺',   goods: '薄棉纸',   need: true,  item: '灯面棉纸', info: '这里是纸铺，薄薄的棉纸透光最好，灯面就选它。', color: C.cyan },
  { id: 'oil',    name: '油铺',   goods: '灯油灯芯', need: true,  item: '灯油与灯芯', info: '这里是油铺，灯油灯芯都齐全，夜里点灯少不了。', color: C.red },
  { id: 'food',   name: '食物摊', goods: '热包子',   need: false, info: '这是食物摊，热包子香气扑鼻——填肚子好，扎灯制药可派不上用场。', color: C.yellow },
  { id: 'misc',   name: '杂货摊', goods: '骰子杂物', need: false, info: '这是杂货摊，骰子针线都是小玩意儿，这趟要找的不在这儿。', color: C.purple }
];
const MARKET_HINTS = [
  { id: 'herb',   who: 'dragon', text: '药庐等着药材下锅，找到卖草药的摊子，把鲜草药备齐。' },
  { id: 'bamboo', who: 'tiger',  text: '灯要立得稳，得选能弯成圈的韧竹篾。' },
  { id: 'paper',  who: 'dragon', text: '灯面要透光才显暖意——挑薄薄的棉纸。' },
  { id: 'oil',    who: 'tiger',  text: '再带上灯油和灯芯，夜里全村都要点灯呢。' }
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
  1: { title: '第一幕', sub: '入山尋藥', fig: 'fig_tiger', poem: ['晨霧未散藥香遠，', '一路草木一路情。'], next: ['Forage'] },
  2: { title: '第二幕', sub: '藥廬濟世', fig: 'fig_carp', poem: ['一杵一杵搗日月，', '藥香吹進萬家門。'], next: ['Market'] },
  3: { title: '第三幕', sub: '守燈驅瘟', fig: 'wenshen', poem: ['風高月黑燈勿滅，', '鼓聲龍吟到天明。'], next: ['Defense'] },
  4: { title: '第四幕', sub: '畫燈題字', fig: 'fig_dragon', poem: ['筆底龍虎生紋彩，', '燈前吉語寄平安。'], next: ['Decorate'] }
};

/* 掷骰子采药棋盘（15 格蛇形山路，第 8 格遇虎、第 13 格遇龙，第 14 格出山） */
const FORAGE_HERB_AT = { 1: 'jinyinhua', 2: 'lianqiao', 3: 'bohe', 4: 'gancao', 5: 'maidong', 6: 'banxia', 7: 'renshen', 9: 'huoxiang', 10: 'zisu', 11: 'chenpi', 12: 'fuling', 14: 'juhua' };
const FORAGE_TIGER_CELL = 8, FORAGE_DRAGON_CELL = 13, FORAGE_EXIT_CELL = 14;
