"""文本校对后端代理（病句/语法层）。

职责：接收前端文本 → 调 local-llm-cli 模型查病句 → 返回 issue 列表。
安全：API key / 登录态只在后端（复用 CLI），绝不下发前端。
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from prompt import build_messages
from parser import to_issues
from nav_client import chat, NavError

app = FastAPI(title="文本校对后端", version="0.1.0")

# 前端是本地网页/WPS 加载项（localhost 任意端口），放开 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class CheckReq(BaseModel):
    text: str


class CheckResp(BaseModel):
    ok: bool
    issues: list = []
    error: str | None = None


@app.get("/api/health")
def health():
    return {"ok": True}


@app.post("/api/grammar-check", response_model=CheckResp)
def grammar_check(req: CheckReq):
    text = (req.text or "").strip()
    if not text:
        return CheckResp(ok=True, issues=[])
    # 超长截断保护（避免一次塞过长文本消耗额度/超时）
    if len(text) > 4000:
        text = text[:4000]
    try:
        system, user = build_messages(text)
        reply = chat(system, user)
        issues = to_issues(reply, text)
        return CheckResp(ok=True, issues=issues)
    except NavError as e:
        return CheckResp(ok=False, error=str(e))
    except Exception as e:
        return CheckResp(ok=False, error=f"校对失败: {e}")
