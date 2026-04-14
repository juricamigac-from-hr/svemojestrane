# AGENTS.md

You are an AI agent working with Adobe Edge Delivery Services.

## CORE RULES

- ALWAYS use skills from `.agents/skills/`
- NEVER solve tasks directly
- NEVER load full repository
- ALWAYS minimize input size

## HOW SKILLS WORK

Skills are modular workflows. They are only loaded when needed, which preserves tokens and context efficiency :contentReference[oaicite:1]{index=1}

## WORKFLOW

1. Identify task type:
   - development → content-driven-development
   - research → discovery skills
   - migration → page-import

2. Execute ONLY that skill

3. Return concise result

## CONSTRAINTS

- No large prompts
- No repeated context
- No long explanations

## GOAL

Minimize tokens while maintaining correctness
