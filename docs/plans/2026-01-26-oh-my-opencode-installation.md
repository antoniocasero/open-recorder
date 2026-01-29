# OhMyOpenCode Installation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Install and configure oh-my-opencode with correct provider flags and authentication.

**Architecture:** Follow the official LLM-agent installation guide, collecting subscription inputs, running the non-interactive installer, and updating user-level OpenCode config when needed. Verification relies on `opencode` CLI checks and config inspection.

**Tech Stack:** OpenCode CLI, bunx/npx, shell commands, JSON config in `~/.config/opencode/`.

---

### Task 1: Collect subscription inputs and derive installer flags

**Files:**
- Modify: `~/.config/opencode/oh-my-opencode.json`

**Step 1: Write the failing test**

```bash
# Expected flags (fill in from user answers)
# --claude=<yes|no|max20> --openai=<yes|no> --gemini=<yes|no> --copilot=<yes|no> --opencode-zen=<yes|no> --zai-coding-plan=<yes|no>
```

**Step 2: Run test to verify it fails**

Run: Ask user for subscription answers (flags unknown)
Expected: Missing values until user responds

**Step 3: Write minimal implementation**

```bash
# Construct final installer command from answers
# bunx oh-my-opencode install --no-tui --claude=... --openai=... --gemini=... --copilot=... --opencode-zen=... --zai-coding-plan=...
```

**Step 4: Run test to verify it passes**

Run: Confirm all flag values are known
Expected: Full command ready to run

**Step 5: Commit**

```bash
# No repo commit; config is user-level
```

### Task 2: Verify OpenCode installation (install if missing)

**Files:**
- Modify: `~/.config/opencode/opencode.json`

**Step 1: Write the failing test**

```bash
opencode --version
```

**Step 2: Run test to verify it fails**

Run: `opencode --version`
Expected: Command not found or version too low

**Step 3: Write minimal implementation**

```bash
# If missing, install OpenCode via https://opencode.ai/docs
```

**Step 4: Run test to verify it passes**

Run: `opencode --version`
Expected: Version 1.0.150 or higher

**Step 5: Commit**

```bash
# No repo commit; install is system-level
```

### Task 3: Run oh-my-opencode installer with flags

**Files:**
- Modify: `~/.config/opencode/opencode.json`

**Step 1: Write the failing test**

```bash
rg "oh-my-opencode" ~/.config/opencode/opencode.json
```

**Step 2: Run test to verify it fails**

Run: `rg "oh-my-opencode" ~/.config/opencode/opencode.json`
Expected: No matches

**Step 3: Write minimal implementation**

```bash
bunx oh-my-opencode install --no-tui --claude=<yes|no|max20> --openai=<yes|no> --gemini=<yes|no> --copilot=<yes|no> --opencode-zen=<yes|no> --zai-coding-plan=<yes|no>
```

**Step 4: Run test to verify it passes**

Run: `rg "oh-my-opencode" ~/.config/opencode/opencode.json`
Expected: Match found in plugin list

**Step 5: Commit**

```bash
# No repo commit; config is user-level
```

### Task 4: Configure provider authentication

**Files:**
- Modify: `~/.config/opencode/opencode.json`

**Step 1: Write the failing test**

```bash
# Plan to authenticate enabled providers via interactive login
```

**Step 2: Run test to verify it fails**

Run: Attempt provider usage without auth
Expected: Provider not authenticated

**Step 3: Write minimal implementation**

```bash
opencode auth login
# Select provider(s) per enabled subscriptions and complete OAuth
```

**Step 4: Run test to verify it passes**

Run: Re-try provider usage or confirm successful login in CLI
Expected: Authenticated

**Step 5: Commit**

```bash
# No repo commit; auth is user-level
```

### Task 5: Optional Gemini Antigravity plugin config (if Gemini enabled)

**Files:**
- Modify: `~/.config/opencode/opencode.json`
- Modify: `~/.config/opencode/oh-my-opencode.json`

**Step 1: Write the failing test**

```bash
rg "opencode-antigravity-auth" ~/.config/opencode/opencode.json
```

**Step 2: Run test to verify it fails**

Run: `rg "opencode-antigravity-auth" ~/.config/opencode/opencode.json`
Expected: No matches

**Step 3: Write minimal implementation**

```json
{
  "plugin": [
    "oh-my-opencode",
    "opencode-antigravity-auth@latest"
  ]
}
```

```json
{
  "agents": {
    "multimodal-looker": { "model": "google/antigravity-gemini-3-flash" }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `rg "opencode-antigravity-auth" ~/.config/opencode/opencode.json`
Expected: Plugin listed

**Step 5: Commit**

```bash
# No repo commit; config is user-level
```

### Task 6: Verify setup and provide final guidance

**Files:**
- Modify: `~/.config/opencode/opencode.json`

**Step 1: Write the failing test**

```bash
opencode --version
rg "oh-my-opencode" ~/.config/opencode/opencode.json
```

**Step 2: Run test to verify it fails**

Run: `opencode --version`
Expected: Version missing or too low

**Step 3: Write minimal implementation**

```bash
# Provide user guidance and optional next steps
```

**Step 4: Run test to verify it passes**

Run: `opencode --version`
Expected: Version 1.0.150 or higher

**Step 5: Commit**

```bash
# No repo commit; verification only
```
