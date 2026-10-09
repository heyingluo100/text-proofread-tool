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

# 文本模型分组 ID（全局规则示例用 13，可按需覆盖）
DEFAULT_GROUP_ID = os.environ.get("LLM_GROUP_ID", "13")


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

    CLI 可能输出日志 + 结果。优先找 JSON 结构里的 data/content，
    回退为取最后一段非空输出。
    """
    text = stdout.strip()
    # 尝试把整段按行扫，找最像模型回复的 JSON 或正文
    for line in reversed(text.splitlines()):
        line = line.strip()
        if not line:
            continue
        # 命中 JSON 数组/对象直接返回该行
        if line.startswith("[") or line.startswith("{"):
            return line
    return text
