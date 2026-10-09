"""长文本分段。

按段落/句子边界把长文切成若干块，每块 ≤ max_len。
为什么按边界切：硬按字数切会把句子拦腰截断，模型看不懂半截句，病句判断会失准。
返回每块 (起始偏移, 文本)，偏移量用于把模型结果定位回全文坐标。
"""
import re

# 句子/段落边界：中文句末标点 + 换行
_BOUNDARY = re.compile(r"[。！？!?\n]")


def split_text(text: str, max_len: int = 1500):
    """切成 [(offset, segment_text), ...]，每段 ≤ max_len。

    策略：从 start 起，取 max_len 长度窗口，在其中找**最后一个**句子边界作为切点；
    若找不到（单句超长）则硬切在 max_len。保证段间无重叠、无遗漏。
    """
    n = len(text)
    if n <= max_len:
        return [(0, text)]

    segments = []
    start = 0
    while start < n:
        end = min(start + max_len, n)
        if end < n:
            window = text[start:end]
            # 找窗口内最后一个边界位置
            pos = -1
            for m in _BOUNDARY.finditer(window):
                pos = m.end()
            # 边界太靠前（单句超长）则放弃，硬切
            if pos >= max_len // 2:
                end = start + pos
        segments.append((start, text[start:end]))
        start = end
    return segments
