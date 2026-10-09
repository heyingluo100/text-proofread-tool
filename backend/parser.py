"""把模型返回的文本解析成前端 issue 结构。

模型被要求返回 JSON 数组：[{wrong, right, note}, ...]
后端在原文里定位每个 wrong 的 index/length，补齐 category/byAI 等字段，
使之与本地规则库的 issue 完全同构，前端可混在一个列表展示。
"""
import json
import re


def _loads(reply: str):
    """宽松解析模型回复为列表。模型偶尔会裹额外文字，抽取第一个 JSON 数组。"""
    reply = reply.strip()
    try:
        data = json.loads(reply)
        if isinstance(data, list):
            return data
    except Exception:
        pass
    # 回退：正则抠出第一个 [...] 数组
    m = re.search(r"\[.*\]", reply, re.S)
    if m:
        try:
            data = json.loads(m.group(0))
            if isinstance(data, list):
                return data
        except Exception:
            pass
    return []


def to_issues(reply: str, text: str, offset: int = 0, id_prefix: str = "ai"):
    """转换为 issue 列表。每条在原文定位 wrong 片段。

    offset: 该片段在全文中的起始偏移（分段校对时用），定位结果加上它回到全文坐标。
    """
    raw = _loads(reply)
    issues = []
    uid = 0
    for item in raw:
        if not isinstance(item, dict):
            continue
        wrong = (item.get("wrong") or "").strip()
        right = (item.get("right") or "").strip()
        note = (item.get("note") or "").strip()
        if not wrong or not right:
            continue
        # 在本段内定位，再加 offset 回到全文坐标（找不到则 index=-1）
        local = text.find(wrong)
        idx = (offset + local) if local >= 0 else -1
        uid += 1
        issues.append({
            "id": f"{id_prefix}{uid}",
            "category": "grammar",
            "categoryLabel": "病句/语法",
            "index": idx,
            "length": len(wrong) if idx >= 0 else 0,
            "wrong": wrong,
            "right": right,
            "note": note or "建议修改",
            "source": "现代汉语语义规范（AI 判定，建议人工复核）",
            "byAI": True,
        })
    return issues
