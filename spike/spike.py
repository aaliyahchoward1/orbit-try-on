#!/usr/bin/env python3
"""
Orbit Try-On — YouCam AI Makeup VTO API spike.

Proves the pipeline end-to-end: task -> poll -> result image, for one OOB shade.
Unit discipline: one shade costs ~1 unit. `--shade all` costs 4 (needs --yes).
Engine/query errors burn NOTHING (per YouCam docs).

Usage:
    export YOUCAM_API_KEY="..."            # from https://yce.makeupar.com/api-console/en/api-keys/
    python3 spike.py --shade nebula --url https://example.com/selfie.jpg
    python3 spike.py --shade all --yes --file-id <FILE_ID>   # after manual upload

Getting a file_id for a local selfie (two curl calls, documented flow):
    1. curl -sS -X POST https://yce-api-01.makeupar.com/s2s/v2.0/file/makeup-vto \
           -H "Authorization: Bearer $YOUCAM_API_KEY"        # -> upload URL + file_id in response
    2. PUT your bytes to the returned upload URL (see README), then rerun with --file-id.

Face rules (from docs): single front-facing face, face width >= 100px,
long side < 1920px, < 10MB, jpg/jpeg/png. Download the result promptly —
the download link can expire ~2h after creation (file_id survives longer).
"""

import argparse
import json
import os
import sys
import time
import urllib.request

API = "https://yce-api-01.makeupar.com"
SHADES_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "shades.json")
POLL_INTERVAL = 5
POLL_TIMEOUT = 300


def api(method, path, key, payload=None):
    req = urllib.request.Request(
        API + path,
        data=json.dumps(payload).encode() if payload is not None else None,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        method=method,
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        print(f"HTTP {e.code}: {body}", file=sys.stderr)
        sys.exit(1)


def run_one(shade_key, shade, key, src, outdir):
    effect = shade["effect"]
    body = {"effects": [effect], "version": "1.0"}
    body["src_file_url" if src[0] == "url" else "src_file_id"] = src[1]

    print(f"[{shade_key}] submitting {shade['name']}...")
    resp = api("POST", "/s2s/v2.0/task/makeup-vto", key, body)
    task_path = os.path.join(outdir, f"{shade_key}-task.json")
    with open(task_path, "w") as f:
        json.dump(resp, f, indent=2)
    try:
        task_id = resp["data"]["task_id"]
    except KeyError:
        print(f"[{shade_key}] unexpected response (saved to {task_path})", file=sys.stderr)
        return False
    print(f"[{shade_key}] task_id={task_id} — polling...")

    deadline = time.time() + POLL_TIMEOUT
    while time.time() < deadline:
        time.sleep(POLL_INTERVAL)
        st = api("GET", f"/s2s/v2.0/task/makeup-vto/{task_id}", key)
        status = st.get("data", {}).get("task_status")
        if status == "success":
            url = st["data"]["results"]["url"]
            dest = os.path.join(outdir, f"{shade_key}-result.jpg")
            urllib.request.urlretrieve(url, dest)
            print(f"[{shade_key}] SUCCESS -> {dest}")
            print(f"[{shade_key}] compare against the real {shade['name']} gloss vial; tune hex in shades.json if it lies.")
            return True
        if status == "error":
            print(f"[{shade_key}] engine error, no units burned: {json.dumps(st)}", file=sys.stderr)
            return False
        # still queued/running — keep polling
    print(f"[{shade_key}] timed out after {POLL_TIMEOUT}s; task_id={task_id} (results retained 24h, re-poll manually).")
    return False


def main():
    p = argparse.ArgumentParser(description="Orbit Try-On YouCam API spike")
    p.add_argument("--shade", required=True,
                   help="black-siren | aquariosa | nebula | blood-moon | all")
    p.add_argument("--url", help="publicly accessible selfie URL")
    p.add_argument("--file-id", help="file_id from a prior File API upload")
    p.add_argument("--yes", action="store_true", help="required with --shade all (burns 4 units)")
    p.add_argument("--out", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "results"))
    p.add_argument("--api-key", default=os.environ.get("YOUCAM_API_KEY"))
    a = p.parse_args()

    if not a.api_key:
        sys.exit("Set YOUCAM_API_KEY (api console -> API Keys) or pass --api-key.")
    if bool(a.url) == bool(a.file_id):
        sys.exit("Give exactly one of --url (public image) or --file-id (uploaded file).")
    with open(SHADES_PATH) as f:
        shades = {k: v for k, v in json.load(f).items() if not k.startswith("_")}
    keys = list(shades) if a.shade == "all" else [a.shade]
    if a.shade == "all" and not a.yes:
        sys.exit("Refusing: --shade all burns 4 units. Re-run with --yes to confirm.")
    for k in keys:
        if k not in shades:
            sys.exit(f"Unknown shade '{k}'. Pick from: {', '.join(shades)}")
    os.makedirs(a.out, exist_ok=True)
    src = ("url", a.url) if a.url else ("file_id", a.file_id)

    ok = True
    for k in keys:
        ok = run_one(k, shades[k], a.api_key, src, a.out) and ok
    print("\nUnit check: https://yce.makeupar.com/api-console/ -> usage record. "
          "Cache every result during dev; never loop-test.")


if __name__ == "__main__":
    main()
