"""通用 LLM 文本模型客户端（OpenAI 兼容接口）。

通过环境变量接入任意 OpenAI 兼容的模型服务：
- LLM_BASE_URL   服务地址（默认 https://api.openai.com/v1）
- LLM_API_KEY    密钥（后端持有，绝不下发前端）
- LLM_MODEL      模型名（默认 gpt-4o-mini）
- LLM_TIMEOUT    单次请求超时秒数（默认 120）

设计取舍：只依赖标准库（urllib），零额外依赖；后端只负责把文本发给
chat 接口并取回复，重试/分段/解析交给上层。
"""
import json
import os
import urllib.error
import urllib.request

class LLMError(Exception):
    pass

BASE_URL = os.environ.get("LLM_BASE_URL", "https://api.openai.com/v1").rstrip("/")
API_KEY = os.environ.get("LLM_API_KEY", "")
MODEL = os.environ.get("LLM_MODEL", "gpt-4o-mini")
TIMEOUT = int(os.environ.get("LLM_TIMEOUT", "120"))


def chat(system: str, user: str, timeout: int = TIMEOUT) -> str:
    """调用 chat/completions，返回模型文本回复。"""
    if not API_KEY:
        raise LLMError("未配置 LLM_API_KEY 环境变量，无法调用模型")

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.1,
    }
    req = urllib.request.Request(
        f"{BASE_URL}/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")[:300]
        raise LLMError(f"模型服务返回 {e.code}: {detail}")
    except (urllib.error.URLError, TimeoutError):
        raise LLMError("调用模型超时或网络不可达")

    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        raise LLMError(f"模型返回格式异常: {json.dumps(data, ensure_ascii=False)[:300]}")
