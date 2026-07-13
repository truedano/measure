# Project Rules & Customizations

This file outlines critical development guidelines and behavioral rules that must be strictly followed for the `measure` project.

## 1. Codebase Memory MCP Indexing
- **Action**: Do NOT force execution of the external Node.js CLI indexing script (`index_repo.js`) at the end of every agent turn. This avoids Windows file-locking conflicts (`write_artifact` sharing violations) with the active background MCP server process.
- **Incremental Updates**: Rely on the background `codebase-memory-mcp` server's built-in file-watching and incremental scanning. The server automatically detects file modifications (`mtime` changes) and parses changed files on demand.
- **Git Synchronization & Persistence**: To package and share index states with teammates (updating `graph.db.zst`), execute `index_repo.js` manually after closing the IDE, or bind it to git pre-commit hooks. Do not make turn-level execution by agents mandatory.
- **Rule**: Always prioritize querying the project-local `codebase-memory-mcp` index (via tools like `search_graph`, `trace_path`, `get_code_snippet`, `query_graph`, `search_code`) to explore and locate codebase information. DO NOT fall back to `grep` or raw file reading tools unless the local index returns insufficient results. This is to ensure queries target the project-local database and minimize token consumption.
- **MCP Priority Constraint**: Before reading or modifying any code file (e.g., `.ts`, `.vue`), you MUST first invoke `search_graph` or `search_code` to search for target symbols or modules. Directly calling `view_file` on code files without an initial MCP query is strictly forbidden. `view_file` should only be used as a fallback for non-code config files (like `PRD.md`, `AGENTS.md`, `.gitignore`) or when the local graph index fails to return template/style block context. Violation of this priority rule will be flagged as a development regression.


## 2. Harness Engineering
- **Rule**: Development must adopt **Harness Engineering** principles.
  - Before writing or changing code, establish a validation harness (e.g., test cases, mocked inputs, or test scripts).
  - Iteratively run code in the harness to prove correctness before integration.

## 3. Regression Guard & Compatibility
- **Rule**: Before committing any changes (addition, modification, or deletion), verify that previous functionalities and data flows are completely unaffected.
- **Action**: Implement and run validation checks/tests to ensure regression-free deployment.

## 4. Karpathy Guidelines
- **Rule**: Follow the [karpathy-guidelines](file:///C:/Users/truedano/.gemini/antigravity/skills/karpathy-guidelines/SKILL.md) skill strictly for all code changes.
  - **Think Before Coding**: State assumptions and push back on complexity.
  - **Simplicity First**: Write only minimal, required code.
  - **Surgical Changes**: Edit only what's necessary, match existing styles, and don't refactor working code.
  - **Goal-Driven Execution**: Define success criteria and loop until verified.

## 5. Token Saving with RTK (Rust Token Killer)
- **Rule**: When executing terminal commands via tool calls, prepend the command with `rtk` if a specialized token-optimized sub-command is supported (e.g., `rtk git`, `rtk npm`, `rtk diff`, `rtk ls`, `rtk find`). This reduces context token bloat.

## 6. PRD Compliance
- **Rule**: All feature implementations must strictly follow the specifications outlined in the project's [PRD.md](file:///c:/nodejsProjects/measure/PRD.md). Do not add unrequested speculative features or deviate from specified behaviors without user confirmation.

## 7. UI/UX Design Standard (ui-ux-pro-max)
- **Rule**: UI/UX design and styling implementation must strictly adhere to the [ui-ux-pro-max](file:///C:/Users/truedano/.gemini/antigravity/skills/ui-ux-pro-max/SKILL.md) skill guidelines.
  - **No Emojis as UI Icons**: Do not use emojis (e.g., 🎨, 🚀, ⚙️) as interface icons. Always prefer clean, inline SVGs (e.g., Lucide or Heroicons).
  - **Cursor Pointer**: Ensure all clickable/interactive cards, buttons, and elements have `cursor: pointer` explicitly defined.
  - **Stable Hover States**: Hover states must use smooth transitions (e.g., color/opacity transitions) and must not cause any layout shift (avoid scale transforms that push adjacent items).
  - **No Native Alerts or Confirms**: Do not use browser-native `alert()` or `confirm()` dialogs. Instead, implement customized modal overlays and temporary toast notification panels to present user confirmations or success/error feedbacks.

## 8. Mandatory Automated Testing
- **Rule**: All core state, logic, scaling computations, and data transformations (such as Pinia stores and core composables) MUST have corresponding automated unit tests. Any modification, addition, or deletion of features requires the creation/updating of automated tests, and all tests must successfully pass in the local test harness (`npm run test`) before the task is considered complete and ready for deployment.


