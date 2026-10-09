"""调用已登录的 local-llm-cli CLI 文本模型（复用其 OAuth/token 刷新）。

为什么复用 CLI：登录态、token 缓存与自动刷新、OAuth 换取 access_token 这套逻辑
CLI 已完整实现，后端不重写，避免出错。后端只负责把文本发给 chat 命令并取回复。
"""
import json
import os
import shutil
import subprocess
from pathlib import Path

class NavError(Exception):
    pass


# local-llm-cli CLI 脚本路径（用户全局 skills 目录）
CLI_SCRIPT = str(Path.home() / ".claude" / "skills" / "local-llm-cli" / "scripts" / "main.ts")

# 文本模型分组 ID（当前可用：12 = 一代文字 gemini-2.5-flash-lite）
DEFAULT_GROUP_ID = os.environ.get("LLM_GROUP_ID", "12")


def _find_bun() -> str:
    """定位 bun 可执行文件。直接用 bun 跑脚本，绕开 npx（Windows 上 npx 是 .cmd）。"""
    # 1) PATH 中
    found = shutil.which("bun")
    if found:
        return found
    # 2) 默认安装位置
    candidates = [
        Path.home() / ".bun" / "bin" / "bun.exe",
        Path.home() / ".bun" / "bin" / "bun",
    ]
    for c in candidates:
        if c.exists():
            return str(c)
    raise NavError("找不到 bun，可执行文件不在 PATH 也不在 ~/.bun/bin")


def chat(system: str, user: str, group_id: str = DEFAULT_GROUP_ID, timeout: int = 120) -> str:
    """调用 CLI 的 chat 命令，返回模型文本回复。

    用 --message 形式传 system/user，避免 shell 转义问题（通过 argv 列表传参）。
    """
    if not Path(CLI_SCRIPT).exists():
        raise NavError(f"local-llm-cli CLI 不存在: {CLI_SCRIPT}")

    bun = _find_bun()
    cmd = [
        bun, CLI_SCRIPT, "chat",
        "--group-id", group_id,
        "--message", f"system:{system}",
        "--message", f"user:{user}",
    ]
    try:
        proc = subprocess.run(
            cmd, capture_output=True, text=True, encoding="utf-8",
            timeout=timeout, shell=False,
        )
    except subprocess.TimeoutExpired:
        raise NavError("调用模型超时")

    if proc.returncode != 0:
        raise NavError(f"CLI 调用失败: {proc.stderr.strip()[:300]}")

    return _extract_reply(proc.stdout)


def _extract_reply(stdout: str) -> str:
    """从 CLI 输出中提取模型回复文本。

    CLI 会先打印日志行（[local-llm-cli] ... / 任务完成 等），再打印模型正文。
    模型正文通常是**多行**的 JSON 数组，因此不能逐行取，要抓完整的 [ ... ] 块。
    """
    text = stdout
    # 优先：抓第一个 '[' 到最后一个 ']' 之间的完整 JSON 数组（跨行）
    start = text.find("[")
    end = text.rfind("]")
    if start != -1 and end != -1 and end > start:
        return text[start:end + 1].strip()
    # 回退：去掉 CLI 日志行后的剩余内容
    lines = [ln for ln in text.splitlines()
             if not ln.strip().startswith("[local-llm-cli]")]
    return "\n".join(lines).strip()
