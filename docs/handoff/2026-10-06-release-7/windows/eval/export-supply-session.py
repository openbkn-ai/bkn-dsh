"""Export only the test question, answer and tool events from a DSH session.

Excludes system prompts, reasoning, credentials, provider/session metadata.
Requires the zstd CLI. Keep the full private profile outside this repository.
"""
import argparse
import json
import pathlib
import re
import subprocess
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit


SECRET_FIELDS = {"token", "accesstoken", "refreshtoken", "password", "clientsecret",
                 "apikey", "authorization", "cookie", "setcookie", "webhookurl"}


def secret_field(key):
    return re.sub(r"[-_]", "", key).lower() in SECRET_FIELDS


def redact_url(match):
    original = match[0]
    try:
        url = urlsplit(original)
        query = parse_qsl(url.query, keep_blank_values=True)
        if "@" not in url.netloc and not any(secret_field(key) for key, _ in query):
            return original
        netloc = url.netloc.rsplit("@", 1)[-1] if "@" in url.netloc else url.netloc
        if "@" in url.netloc:
            netloc = "[REDACTED]@" + netloc
        return urlunsplit((url.scheme, netloc, url.path, urlencode([
            (key, "[REDACTED]" if secret_field(key) else value) for key, value in query
        ]), url.fragment))
    except ValueError:
        # Malformed URLs cannot be safely decomposed for selective redaction.
        return "[REDACTED URL]"


def redact(value):
    """Scrub credential-shaped literals, including sandbox event repr output."""
    if isinstance(value, list):
        return [redact(item) for item in value]
    if isinstance(value, dict):
        return {key: ("[REDACTED]" if secret_field(key)
                     else redact(item)) for key, item in value.items()}
    if isinstance(value, str):
        # Both JSON and Python repr occur in tool responses. Do not impose a
        # minimum credential length; preserve surrounding text and quantities.
        for quote in ["'", '"']:
            pattern = (r"(?i)(" + quote + r"([A-Za-z_-]+)" + quote + r"\s*:\s*)"
                       + quote + r"(?:\\.|[^" + quote + r"\\\r\n])*" + quote)
            value = re.sub(pattern, lambda m: m[1]+quote+"[REDACTED]"+quote
                           if secret_field(m[2]) else m[0], value)
        value = re.sub(r"(?i)Bearer\s+[A-Za-z0-9_.~+/=-]+", "Bearer [REDACTED]", value)
        value = re.sub(r"https?://[^\s<>\"'\\]+", redact_url, value)
    return value


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("session", type=pathlib.Path)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    data = subprocess.run(["zstd", "-dc", str(args.session)], capture_output=True, check=True).stdout.decode()
    events, question, answers, turn_ends = [], [], [], []
    for line in data.splitlines():
        row = json.loads(line)
        kind, body = row["type"], row.get("data", {})
        if kind == "user/message" and body.get("source", {}).get("kind") == "user":
            question.extend(item["text"] for item in body.get("content", []) if item["type"] == "text")
        elif kind == "assistant/message":
            message = body.get("message", {})
            text = "\n".join(item["text"] for item in message.get("content", []) if item["type"] == "text")
            if text:
                answers.append(text)
        elif kind == "turn/end":
            turn_ends.append({"time": row["time"], "turn": body["turn"], "reason": body["reason"]})
        elif kind == "tool/call":
            events.append({"type": kind, "time": row["time"], **{key: body[key] for key in ["turn", "step", "callId", "name", "arguments"]}})
        elif kind == "tool/result":
            message = body["message"]
            events.append({"type": kind, "time": row["time"], "turn": body["turn"], "step": body["step"],
                           "callId": message["toolCallId"], "hostErrorFlag": body.get("isError"),
                           "content": [item for item in message.get("content", []) if item["type"] == "text"]})
    export = {"sessionId": args.session.parent.name, "question": question, "assistantText": answers, "toolEvents": events, "turnEnds": turn_ends}
    export = redact(export)
    encoded = json.dumps(export, ensure_ascii=False, indent=2)
    if re.search(r"\b(?:sk-[A-Za-z0-9_-]{12,}|Bearer\s+[A-Za-z0-9_.-]{12,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.)", encoded):
        raise RuntimeError("Possible credential in export; inspect privately, do not save")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.with_suffix(".json").write_text(encoded + "\n")
    safe_answers = export["assistantText"]
    args.output.with_suffix(".md").write_text(safe_answers[-1] + "\n" if safe_answers else "No final answer yet.\n")
    print(json.dumps({"sessionId": export["sessionId"], "question": export["question"], "toolCalls": sum(e["type"] == "tool/call" for e in events), "answerChars": len(safe_answers[-1]) if safe_answers else 0}, ensure_ascii=False))


if __name__ == "__main__":
    main()
