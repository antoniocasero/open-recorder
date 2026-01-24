#!/usr/bin/env python3
import os


def read_file(path):
    try:
        with open(path, "r") as f:
            return f.read()
    except:
        return ""


state = read_file(".planning/STATE.md")
roadmap = read_file(".planning/ROADMAP.md")
requirements = read_file(".planning/REQUIREMENTS.md")
research = read_file(".planning/phases/01-transcription-mvp/01-RESEARCH.md")

prompt = (
    """First, read ~/.opencode/agents/gsd-planner.md for your role and instructions.

<planning_context>

**Phase:** 1
**Mode:** standard

**Project State:**
"""
    + state
    + """

**Roadmap:**
"""
    + roadmap
    + """

**Requirements (if exists):**
"""
    + requirements
    + """

**Phase Context (if exists):**
None yet

**Research (if exists):**
"""
    + research
    + """

**Gap Closure (if --gaps mode):**
None

</planning_context>

<downstream_consumer>
Output consumed by /gsd/execute-phase
Plans must be executable prompts with:

- Frontmatter (wave, depends_on, files_modified, autonomous)
- Tasks in XML format
- Verification criteria
- must_haves for goal-backward verification
</downstream_consumer>

<quality_gate>
Before returning PLANNING COMPLETE:

- [ ] PLAN.md files created in phase directory
- [ ] Each plan has valid frontmatter
- [ ] Tasks are specific and actionable
- [ ] Dependencies correctly identified
- [ ] Waves assigned for parallel execution
- [ ] must_haves derived from phase goal
</quality_gate>
"""
)

print(prompt)
