// 标点符号规则（依据 GB/T 15834《标点符号用法》）
// 每条规则: { id, type, label, source, test(text) -> [{ index, length, wrong, right, note }] }

const SOURCE = 'GB/T 15834《标点符号用法》'

// 中文语境里误用的英文标点 → 对应中文标点
const enToZh = {
  ',': '，',
  ';': '；',
  '?': '？',
  '!': '！'
  // 英文冒号/句点在中文里的替换歧义较大（时间、数字、英文词），不在规则层强判
}

function hasCJKAround(text, i) {
  // 判断该半角标点是否处于中文语境：前或后字符为中日韩统一表意文字
  const cjk = /[一-鿿]/
  const prev = text[i - 1] || ''
  const next = text[i + 1] || ''
  return cjk.test(prev) || cjk.test(next)
}

export const punctuationRules = [
  {
    id: 'en-punct-in-cjk',
    type: 'punctuation',
    label: '中文语境误用英文标点',
    source: SOURCE,
    test(text) {
      const hits = []
      for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        if (enToZh[ch] && hasCJKAround(text, i)) {
          hits.push({
            index: i,
            length: 1,
            wrong: ch,
            right: enToZh[ch],
            note: `中文语境应使用中文标点"${enToZh[ch]}"`
          })
        }
      }
      return hits
    }
  },
  {
    id: 'repeated-punct',
    type: 'punctuation',
    label: '标点重复',
    source: SOURCE,
    test(text) {
      const hits = []
      // 连续重复的句号/逗号/问号/叹号（中文）
      const re = /([，。？！；])\1+/g
      let m
      while ((m = re.exec(text)) !== null) {
        hits.push({
          index: m.index,
          length: m[0].length,
          wrong: m[0],
          right: m[1],
          note: '标点不应连续重复'
        })
      }
      return hits
    }
  },
  {
    id: 'space-before-cjk-punct',
    type: 'punctuation',
    label: '中文标点前多余空格',
    source: SOURCE,
    test(text) {
      const hits = []
      const re = / +([，。？！；：、])/g
      let m
      while ((m = re.exec(text)) !== null) {
        hits.push({
          index: m.index,
          length: m[0].length,
          wrong: m[0],
          right: m[1],
          note: '中文标点前不应有空格'
        })
      }
      return hits
    }
  }
]
