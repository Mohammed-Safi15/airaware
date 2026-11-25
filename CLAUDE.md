# CLAUDE.md - AirAware Startup & Guidelines

## Startup Instructions for Claude Sessions
1. **Read `PROGRESS.md` FIRST**: Before inspecting any source files or running commands, read `PROGRESS.md` to know the current phase, completed tasks, and exact next steps.
2. **Read Code Knowledge Graph (Phase 2+)**: Once Graphify is active, consult `graphify-out/GRAPH_REPORT.md` and `graphify-out/graph.json` to understand file dependencies and module structure without scanning the entire repo.
3. **Never Modify PRD Guardrails**: Never alter data integrity rules (no zero-substitutions for missing pollutants, measurement vs. fetch timestamps), exposure logic (no station index averaging), or hybrid AI fallback rules without explicit user approval.
4. **Secret Management**: Never hardcode API keys or commit `.env` or `.dev.vars` files. Use `.env.example` and `.dev.vars.example` for templates.

## Git Commit Attribution
- End git commit messages with:
  Co-Authored-By: Claude Code <noreply@anthropic.com>
- End pull request descriptions with:
  🤖 Generated with [Claude Code](https://claude.com/claude-code)
