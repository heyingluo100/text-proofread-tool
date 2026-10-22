"""文本校对后端代理（病句/语法层）。

职责：接收前端文本 → 长文分段 → 逐段调 LLM 模型查病句 → 流式返回结果。
安全：API key 只在后端持有，绝不下发前端。
"""
import json
import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from prompt import build_messages
from parser import to_issues
from segment import split_text
from llm_client import chat, LLMError

app = FastAPI(title="文本校对后端", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 单段最大长度（超过则分段）
SEG_MAX = 1500


class CheckReq(BaseModel):
    text: str


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


@app.get("/api/health")
def health():
    return {"ok": True}


@app.post("/api/grammar-check")
def grammar_check(req: CheckReq):
    """非流式版本（兼容）：一次性返回全部分段结果。"""
    text = (req.text or "").strip()
    if not text:
        return {"ok": True, "issues": [], "segments": 0, "error": None}

    segments = split_text(text, SEG_MAX)
    all_issues = []
    for i, (offset, seg) in enumerate(segments):
        try:
            system, user = build_messages(seg)
            reply = chat(system, user)
            all_issues.extend(to_issues(reply, seg, offset, id_prefix=f"ai{i}_"))
        except LLMError as e:
            return {"ok": False, "issues": all_issues, "segments": len(segments),
                    "error": f"第 {i + 1} 段失败：{e}"}
    return {"ok": True, "issues": all_issues, "segments": len(segments), "error": None}


@app.post("/api/grammar-check-stream")
def grammar_check_stream(req: CheckReq):
    """流式版本：SSE 推送，带真实分段进度，前端可显示「第 i/N 段」。"""
    text = (req.text or "").strip()

    def gen():
        if not text:
            yield _sse("done", {"ok": True, "issues": [], "segments": 0})
            return
        segments = split_text(text, SEG_MAX)
        total = len(segments)
        # 先发分段计划，前端据此显示提示
        yield _sse("plan", {"segments": total, "chars": len(text)})
        all_issues = []
        for i, (offset, seg) in enumerate(segments):
            yield _sse("progress", {"current": i + 1, "total": total})
            try:
                system, user = build_messages(seg)
                reply = chat(system, user)
                seg_issues = to_issues(reply, seg, offset, id_prefix=f"ai{i}_")
                all_issues.extend(seg_issues)
                yield _sse("segment", {"current": i + 1, "total": total, "issues": seg_issues})
            except LLMError as e:
                yield _sse("error", {"current": i + 1, "total": total, "error": str(e)})
                yield _sse("done", {"ok": False, "issues": all_issues, "segments": total})
                return
        yield _sse("done", {"ok": True, "issues": all_issues, "segments": total})

    return StreamingResponse(gen(), media_type="text/event-stream")


# ── 托管网页前端（同源：网页与病句 API 同端口，免 CORS/免单独起前端服务）──
# dist 位于项目根的 dist/（backend 的上一级）。存在才挂载。
_DIST = Path(__file__).resolve().parent.parent / "dist"
if _DIST.is_dir():
    # html=True 使根路径自动返回 index.html
    app.mount("/", StaticFiles(directory=str(_DIST), html=True), name="web")
