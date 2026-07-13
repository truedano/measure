# Project Rules & Customizations

This file outlines critical development guidelines and behavioral rules that must be strictly followed for the `measure` project.

## 1. Codebase Memory MCP Indexing
- **Action**: Any addition, modification, or deletion of code MUST trigger an index update.
- **Rule**: Always prioritize querying the project-local `codebase-memory-mcp` index (via tools like `search_graph`, `trace_path`, `get_code_snippet`, `query_graph`, `search_code`) to explore and locate codebase information. DO NOT fall back to `grep` or raw file reading tools unless the local index returns insufficient results. This is to ensure queries target the project-local database and minimize token consumption.
- **Persistence**: The index database MUST be stored within the project directory. When calling `index_repository`, always set the parameter `persistence` to `true`. This will store the SQLite graph databases and the compressed `graph.db.zst` within the project's `.codebase-memory/` directory.
- **Execution Mechanism**: Index updates MUST be performed by invoking the native MCP tool `index_repository` within the IDE session, rather than executing standalone terminal scripts. This ensures that the MCP server process (which locks `graph.db.zst`) handles the write operation internally, avoiding file lock access errors and guaranteeing that the compressed graph index is correctly regenerated.


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


