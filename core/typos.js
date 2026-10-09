// 常见错别字/别字库（对标现代汉语规范词形）
// 每条: { wrong, right, note }
//   wrong = 错误写法（命中即标），right = 规范写法
// 分区：成语误写 / 常见词语别字 / 易混字词
// 说明：收录的是语言规范事实（如"迫不及待"不写"迫不急待"），非词典词条数据。

const idiom = [
  { wrong: '迫不急待', right: '迫不及待', note: '规范词形为"及"' },
  { wrong: '一愁莫展', right: '一筹莫展', note: '规范词形为"筹"' },
  { wrong: '重蹈复辙', right: '重蹈覆辙', note: '规范词形为"覆"' },
  { wrong: '煞废苦心', right: '煞费苦心', note: '规范词形为"费"' },
  { wrong: '金榜提名', right: '金榜题名', note: '规范词形为"题"' },
  { wrong: '走头无路', right: '走投无路', note: '规范词形为"投"' },
  { wrong: '甘败下风', right: '甘拜下风', note: '规范词形为"拜"' },
  { wrong: '不加思索', right: '不假思索', note: '规范词形为"假"' },
  { wrong: '破斧沉舟', right: '破釜沉舟', note: '规范词形为"釜"' },
  { wrong: '再接再励', right: '再接再厉', note: '规范词形为"厉"' },
  { wrong: '谈笑风声', right: '谈笑风生', note: '规范词形为"生"' },
  { wrong: '世外桃园', right: '世外桃源', note: '规范词形为"源"' },
  { wrong: '要言不繁', right: '要言不烦', note: '规范词形为"烦"' },
  { wrong: '变本加利', right: '变本加厉', note: '规范词形为"厉"' },
  { wrong: '病入膏盲', right: '病入膏肓', note: '规范词形为"肓"' },
  { wrong: '阴谋鬼计', right: '阴谋诡计', note: '规范词形为"诡"' },
  { wrong: '出奇不意', right: '出其不意', note: '规范词形为"其"' },
  { wrong: '礼上往来', right: '礼尚往来', note: '规范词形为"尚"' },
  { wrong: '仗义直言', right: '仗义执言', note: '规范词形为"执"' },
  { wrong: '穿流不息', right: '川流不息', note: '规范词形为"川"' },
  { wrong: '一如继往', right: '一如既往', note: '规范词形为"既"' },
  { wrong: '错落有志', right: '错落有致', note: '规范词形为"致"' }
]

// 常见词语别字
const words = [
  { wrong: '按装', right: '安装', note: '规范词形为"安"' },
  { wrong: '松驰', right: '松弛', note: '规范词形为"弛"' },
  { wrong: '扫瞄', right: '扫描', note: '规范词形为"描"' },
  { wrong: '渡假', right: '度假', note: '时间用"度"，水域用"渡"' },
  { wrong: '必竟', right: '毕竟', note: '规范词形为"毕"' },
  { wrong: '脉博', right: '脉搏', note: '规范词形为"搏"' },
  { wrong: '元霄', right: '元宵', note: '节令食品用"宵"' },
  { wrong: '通霄', right: '通宵', note: '整夜用"宵"' },
  { wrong: '国藉', right: '国籍', note: '规范词形为"籍"' },
  { wrong: '伏卧撑', right: '俯卧撑', note: '规范词形为"俯"' },
  { wrong: '气慨', right: '气概', note: '规范词形为"概"' },
  { wrong: '幅射', right: '辐射', note: '规范词形为"辐"' },
  { wrong: '布署', right: '部署', note: '规范词形为"部"' },
  { wrong: '刻服', right: '克服', note: '规范词形为"克"' },
  { wrong: '那怕', right: '哪怕', note: '规范词形为"哪"' },
  { wrong: '即然', right: '既然', note: '规范词形为"既"' },
  { wrong: '沉缅', right: '沉湎', note: '规范词形为"湎"' },
  { wrong: '账蓬', right: '帐篷', note: '规范词形为"帐篷"' },
  { wrong: '安祥', right: '安详', note: '规范词形为"详"' },
  { wrong: '辨论', right: '辩论', note: '言语用"辩"' },
  { wrong: '辩别', right: '辨别', note: '分辨用"辨"' },
  { wrong: '部份', right: '部分', note: '规范词形为"分"' },
  { wrong: '发浑', right: '发昏', note: '规范词形为"昏"' },
  { wrong: '欧打', right: '殴打', note: '规范词形为"殴"' },
  { wrong: '贪脏', right: '贪赃', note: '规范词形为"赃"' },
  { wrong: '渲泄', right: '宣泄', note: '规范词形为"宣"' },
  { wrong: '九洲', right: '九州', note: '行政区划用"州"' },
  { wrong: '脚指', right: '脚趾', note: '规范词形为"趾"' }
]

// 成语误写（补充批）
const idiom2 = [
  { wrong: '原型毕露', right: '原形毕露', note: '规范词形为"形"' },
  { wrong: '不径而走', right: '不胫而走', note: '规范词形为"胫"' },
  { wrong: '合盘托出', right: '和盘托出', note: '规范词形为"和"' },
  { wrong: '默守成规', right: '墨守成规', note: '规范词形为"墨"' },
  { wrong: '名符其实', right: '名副其实', note: '规范词形为"副"' },
  { wrong: '相形见拙', right: '相形见绌', note: '规范词形为"绌"' },
  { wrong: '察颜观色', right: '察言观色', note: '规范词形为"言"' },
  { wrong: '披星带月', right: '披星戴月', note: '规范词形为"戴"' },
  { wrong: '直接了当', right: '直截了当', note: '规范词形为"截"' },
  { wrong: '永保青春', right: '永葆青春', note: '规范词形为"葆"' },
  { wrong: '融汇贯通', right: '融会贯通', note: '规范词形为"会"' },
  { wrong: '旁证博引', right: '旁征博引', note: '规范词形为"征"' },
  { wrong: '一张一驰', right: '一张一弛', note: '规范词形为"弛"' },
  { wrong: '兴高彩烈', right: '兴高采烈', note: '规范词形为"采"' },
  { wrong: '神彩奕奕', right: '神采奕奕', note: '规范词形为"采"' },
  { wrong: '慢不经心', right: '漫不经心', note: '规范词形为"漫"' },
  { wrong: '鬼鬼崇崇', right: '鬼鬼祟祟', note: '规范词形为"祟"' },
  { wrong: '相辅相承', right: '相辅相成', note: '规范词形为"成"' },
  { wrong: '卑恭屈膝', right: '卑躬屈膝', note: '规范词形为"躬"' },
  { wrong: '幅圆辽阔', right: '幅员辽阔', note: '规范词形为"员"' },
  { wrong: '随声附合', right: '随声附和', note: '规范词形为"和"' },
  { wrong: '纷至踏来', right: '纷至沓来', note: '规范词形为"沓"' },
  { wrong: '以身作责', right: '以身作则', note: '规范词形为"则"' }
]

// 常见词语别字（补充批）
const words2 = [
  { wrong: '装璜', right: '装潢', note: '规范词形为"潢"' },
  { wrong: '峻工', right: '竣工', note: '规范词形为"竣"' },
  { wrong: '报负', right: '抱负', note: '规范词形为"抱"' },
  { wrong: '部置', right: '布置', note: '规范词形为"布"' },
  { wrong: '寒喧', right: '寒暄', note: '规范词形为"暄"' },
  { wrong: '座落', right: '坐落', note: '规范词形为"坐"' },
  { wrong: '粗旷', right: '粗犷', note: '规范词形为"犷"' },
  { wrong: '针贬', right: '针砭', note: '规范词形为"砭"' },
  { wrong: '和霭', right: '和蔼', note: '规范词形为"蔼"' },
  { wrong: '迁徒', right: '迁徙', note: '规范词形为"徙"' },
  { wrong: '陷井', right: '陷阱', note: '规范词形为"阱"' },
  { wrong: '腊烛', right: '蜡烛', note: '蜡烛用"蜡"' }
]

// 高频易混词（补充批 3）
const words3 = [
  { wrong: '即使如此', right: '即使如此', note: '', skip: true },
  { wrong: '一摸一样', right: '一模一样', note: '规范词形为"模"' },
  { wrong: '迫不急待', right: '迫不及待', note: '', skip: true },
  { wrong: '不容质疑', right: '不容置疑', note: '规范词形为"置"' },
  { wrong: '不加思索', right: '不假思索', note: '', skip: true },
  { wrong: '手屈一指', right: '首屈一指', note: '规范词形为"首"' },
  { wrong: '谈笑风声', right: '谈笑风生', note: '', skip: true },
  { wrong: '题纲', right: '提纲', note: '规范词形为"提"' },
  { wrong: '题词', right: '题词', note: '', skip: true },
  { wrong: '渡过难关', right: '度过难关', note: '时间用"度"' },
  { wrong: '迫使', right: '迫使', note: '', skip: true },
  { wrong: '恢谐', right: '诙谐', note: '规范词形为"诙"' },
  { wrong: '九宵', right: '九霄', note: '天空用"霄"' },
  { wrong: '渡船', right: '渡船', note: '', skip: true },
  { wrong: '迁就', right: '迁就', note: '', skip: true },
  { wrong: '渲染', right: '渲染', note: '', skip: true },
  { wrong: '不段', right: '不断', note: '规范词形为"断"' },
  { wrong: '既使', right: '即使', note: '规范词形为"即"' },
  { wrong: '以经', right: '已经', note: '规范词形为"已"' },
  { wrong: '按排', right: '安排', note: '规范词形为"安"' },
  { wrong: '发奋图强', right: '发愤图强', note: '规范词形为"愤"' },
  { wrong: '墨守陈规', right: '墨守成规', note: '规范词形为"成"' },
  { wrong: '美仑美奂', right: '美轮美奂', note: '规范词形为"轮"' },
  { wrong: '了望', right: '瞭望', note: '远望用"瞭"' },
  { wrong: '脏款', right: '赃款', note: '规范词形为"赃"' },
  { wrong: '肪碍', right: '妨碍', note: '规范词形为"妨"' }
].filter(v => !v.skip)

// 高频别字与成语（补充批 4，收口批）
const batch4 = [
  { wrong: '通牒', right: '通牒', note: '', skip: true },
  { wrong: '渡轮', right: '渡轮', note: '', skip: true },
  { wrong: '气喘嘘嘘', right: '气喘吁吁', note: '规范词形为"吁"' },
  { wrong: '病如山倒', right: '病来如山倒', note: '', skip: true },
  { wrong: '张慌', right: '张皇', note: '规范词形为"皇"' },
  { wrong: '惊慌失错', right: '惊慌失措', note: '规范词形为"措"' },
  { wrong: '谛造', right: '缔造', note: '规范词形为"缔"' },
  { wrong: '松弛有度', right: '松弛有度', note: '', skip: true },
  { wrong: '恻隐之心', right: '恻隐之心', note: '', skip: true },
  { wrong: '不屑置辨', right: '不屑置辩', note: '规范词形为"辩"' },
  { wrong: '明辩是非', right: '明辨是非', note: '规范词形为"辨"' },
  { wrong: '汗流夹背', right: '汗流浃背', note: '规范词形为"浃"' },
  { wrong: '两全齐美', right: '两全其美', note: '规范词形为"其"' },
  { wrong: '哄堂大笑', right: '哄堂大笑', note: '', skip: true },
  { wrong: '欢度佳节', right: '欢度佳节', note: '', skip: true },
  { wrong: '轻歌漫舞', right: '轻歌曼舞', note: '规范词形为"曼"' },
  { wrong: '绿草如荫', right: '绿草如茵', note: '规范词形为"茵"' },
  { wrong: '不可明状', right: '不可名状', note: '规范词形为"名"' },
  { wrong: 'орган', right: '', note: '', skip: true },
  { wrong: '惨绝人圜', right: '惨绝人寰', note: '规范词形为"寰"' },
  { wrong: '鸠占雀巢', right: '鸠占鹊巢', note: '规范词形为"鹊"' },
  { wrong: '椎心泣血', right: '椎心泣血', note: '', skip: true },
  { wrong: '一股作气', right: '一鼓作气', note: '规范词形为"鼓"' },
  { wrong: '甘之如殆', right: '甘之如饴', note: '规范词形为"饴"' },
  { wrong: '伶牙利齿', right: '伶牙俐齿', note: '规范词形为"俐"' },
  { wrong: '弱不经风', right: '弱不禁风', note: '规范词形为"禁"' },
  { wrong: '英雄倍出', right: '英雄辈出', note: '规范词形为"辈"' },
  { wrong: '责无旁代', right: '责无旁贷', note: '规范词形为"贷"' },
  { wrong: '鞠躬尽粹', right: '鞠躬尽瘁', note: '规范词形为"瘁"' },
  { wrong: '层峦叠障', right: '层峦叠嶂', note: '规范词形为"嶂"' },
  { wrong: 'melody', right: '', note: '', skip: true },
  { wrong: '记忆尤新', right: '记忆犹新', note: '规范词形为"犹"' },
  { wrong: '谈笑自若', right: '谈笑自若', note: '', skip: true },
  { wrong: '按步就班', right: '按部就班', note: '规范词形为"部"' },
  { wrong: '英姿勃发', right: '英姿勃发', note: '', skip: true },
  { wrong: '鬼斧神功', right: '鬼斧神工', note: '规范词形为"工"' },
  { wrong: '不卑不吭', right: '不卑不亢', note: '规范词形为"亢"' },
  { wrong: '前仆后拥', right: '前呼后拥', note: '规范词形为"呼"' },
  { wrong: '察言观色', right: '察言观色', note: '', skip: true },
  { wrong: '察颜观色', right: '察言观色', note: '', skip: true }
].filter(v => !v.skip)

export const typos = [].concat(idiom, words, idiom2, words2, words3, batch4)
