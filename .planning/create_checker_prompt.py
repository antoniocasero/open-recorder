#!/usr/bin/env python3
import os


def read_file(path):
    try:
        with open(path, "r") as f:
            return f.read()
    except:
        return ""


plans = read_file(".planning/phases/01-transcription-mvp/01-01-PLAN.md")
plans += "\n" + read_file(".planning/phases/01-transcription-mvp/01-02-PLAN.md")
plans += "\n" + read_file(".planning/phases/01-transcription-mvp/01-03-PLAN.md")
plans += "\n" + read_file(".planning/phases/01-transcription-mvp/01-04-PLAN.md")
plans += "\n" + read_file(".planning/phases/01-transcription-mvp/01-05-PLAN.md")
requirements = read_file(".planning/REQUIREMENTS.md")

# Extract phase goal from roadmap
roadmap = read_file(".planning/ROADMAP.md")
import re

goal_match = re.search(
    r"### Phase 1: Transcription MVP\s*\*\*Goal\*\*: (.*?)\s*\*\*Depends",
    roadmap,
    re.DOTALL,
)
goal = (
    goal_match.group(1).strip()
    if goal_match
    else "User can transcribe audio recordings using OpenAI Whisper API with clear feedback and saved results"
)

prompt = f"""<verification_context>

**Phase:** 1
**Phase Goal:** {goal}

**Plans to verify:**
{plans}

**Requirements (if exists):**
{requirements}

</verification_context>

<expected_output>
Return one of:
- ## VERIFICATION PASSED — all checks pass
- ## ISSUES FOUND — structured issue list
</expected_output>
"""

print(prompt)
