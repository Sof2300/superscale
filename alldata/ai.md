I'll explore the project structure and find the alldata client UI code.
Let me start by exploring the codebase to find the "alldata" client UI code.

Let me look at the project structure first.

The alldata folder is the client UI. Let me survey its main files.
The user wants me to check the "client UI in alldata". Let me look at the alldata directory files, particularly the JS UI files. Let me read the key files: CommandUI.js, Component.js, ComponentInteractive.js, HarvestGraph.js, PageUI.js, index.html, ai.md.

Let me start with a broad overview. Let me check the sizes first.

ai.md is a stale review of a different project. Let me read the actual alldata UI sources.
The ai.md is a previous review of a DIFFERENT project (RfidRemoteControl), not alldata. So it's not directly relevant but gives a style template.

Now let me read the actual alldata client UI files. Key files:
- CommandUI.js (96KB) - biggest
- PageUI.js (40KB)
- index.html (27KB)
- ComponentInteractive.js (26KB)
- HarvestGraph.js (25KB)
- Component.js (21KB)

Total ~236KB of JS. That's a lot. Let me read them. I should probably read the main ones myself and maybe use subagents for parallel... but the user wants a review with deep understanding. Let me read the files.

Let me start with the smaller ones and index.html to understand structure, then the big ones.

Actually let me be efficient. Let me read index.html, Component.js, ComponentInteractive.js, PageUI.js, HarvestGraph.js, CommandUI.js. CommandUI.js is 96KB (~2000+ lines). Let me read them.

Let me start in parallel with several reads.

Now the interactive/component and page layers.
This is a classic hand-rolled virtual DOM-ish component framework. Let me continue reading ComponentInteractive.js, PageUI.js, HarvestGraph.js, and then CommandUI.js.

Let me read them in parallel. ComponentInteractive.js (26KB) and PageUI.js (40KB). HarvestGraph.js (25KB). CommandUI.js (96KB) is big, I'll read in chunks.

Let me read ComponentInteractive.js and PageUI.js.

Now PageUI.js and HarvestGraph.js.

Now the large CommandUI.js and HarvestGraph.js.
Now the biggest file, CommandUI.js (96KB, ~2300 lines). Let me read it. And HarvestGraph.js.

Let me read CommandUI.js in chunks. First chunk.

Let me continue reading CommandUI.js. I'll read the next chunks.

Continue reading CommandUI.js from 1400.

Continue reading the rest of CommandUI.js from 2100.

I've now read all of index.html, Component.js, ComponentInteractive.js, PageUI.js, CommandUI.js. Let me read HarvestGraph.js too since it's part of the client UI. And check the bundler/bundler.js which is a build tool. But the user asked "check the client UI in alldata" - so the client UI files. HarvestGraph.js is part of it.

Let me read HarvestGraph.js.

Let me check the build tooling and scan for global-state patterns.
Now I have a good overview. Let me also glance at the bundler since it's a tool for the client UI (bundler.js, buildUI.js). But the user asked about "client UI in alldata" - so the main UI files. Let me check the buildUI.js and bundler briefly to understand the build pipeline, since it might matter for organization.

Actually, let me focus. The user wants:
1. Overview of the code
2. Antipatterns
3. Patterns that would help make code clearer/better organized

I've read all the main UI files. Let me quickly check buildUI.js and package.json to understand the bundling, since it's relevant to "better organized".

Let me also check the grep for global variables etc.

Let me read buildUI.js and package.json.

I now have a full picture of the client UI. Let me also do a quick grep for obvious bugs like `this.subitems.back()`, `this.cellindex()` weird calls, undefined globals, etc. I noticed several already:

1. `Component.js` line 46/49: `if(this.tag) this.html+="<"+this.tag+...` but then `</` — fine.
2. `Component.js` Table.clear() line 440: `this.subitems.back()` — Array.prototype.back() doesn't exist in JS! That's a bug (should be `this.subitems[this.subitems.length-1]` or `.pop()`). Actually it would throw TypeError. But clear() might not be called in practice.
3. `Table.getCell(row,col){return this.cellindex(row,col);}` line 400-401 — calling array as function, bug.
4. `Table.parseContent` line 446: `this.cellindex[t]=[];` but `t` is undefined (should be a param). Actually parseContent(table) - no `t`. Legacy dead code.
5. `MultiTable.parseContent(v)` line 376-379 uses `t` similarly.
6. `ComponentNode.removeListener` line 106: loop `for(let i=rem[rem.length-1];i>=0;i++) rem.splice(i,1);` — increment instead of decrement, and starting index weird. Bug.
7. `Span.updateHtml` line 283: `this.html+=...` accumulates every call (should be `=`). Bug.
8. `DivItem.updateHtml` line 299 same `+=`.
9. `Input.updateHtml` line 117: `this.html+=` but Input doesn't override... actually Input extends InteractiveItem extends ComponentItem; ComponentItem.updateHtml sets `this.html=this.text`, but Input overrides. `+=` accumulation bug.
10. `CommandUI.set()` line 2111: `disenableload("/set" + args, this.commandlineui.getCompIds());` fine.
11. `CommandMultiUI.update` line 1165: `Console.log` — capital C, undefined → would throw. Actually `Console` is not defined → ReferenceError. But only reached if `!this.commandlineuis[i]`.
12. `MultiLineUI.updateFile` line 575: `this.lineui.updatefile(data)` — `this.lineui` undefined (should be lineuis), bug.
13. index.html `updateIpLink`: uses `tobj.config.IP` but config uses `ip`. Mismatch — IP link never shows.
14. `enableloadjson` uses `loading` global.
15. `getValidEvents(data)` called with `this.data` which is a data object in ChronoStatUI.update — `getValidEvents` expects string/array. In ChronoStatUI.update(data), data is tobj (the json object), then `getValidEvents(this.data)` → typeof not string, not array → returns []. Hmm, that looks like a bug, but maybe `this.data` was set to the datafile string elsewhere. Actually in PageUI.updateDataFile(data) calls chronostat.update(data) where data is the datafile string. Then ChronoStatUI.update sets this.data = data (string). But then also `getValidEvents(this.data)`. OK so it's the string. Fine.
16. `ComponentNode.applyProperties` else branch `console.log()` — noisy.
17. Global mutable state: `currentcommandUI`, `dataobj`, `appConfig`, `cacheddata`, `loading`, `init`, `userActionPending` (never declared! used in disenableload as global assignment → implicit global; in strict mode would throw), `ptobj` global.

Let me verify `userActionPending` declaration.

Let me grep for it.

Also there's the dead ai.md and lots of commented-out code.

Let me do a few targeted greps to confirm bugs and gather global scope issues. I should be careful not to over-report. The user asked for an overview + antipatterns + patterns. This is a review task, not a code-change task. So I should produce a well-structured review.

Let me grep for a few things to confirm.

Confirmed: `userActionPending` is an implicit global (never declared with var/let). Also `ptobj` at line 227 is implicit global.

I have enough. Let me now write a structured review. The user wants:
1. Overview
2. Antipatterns
3. Patterns to improve organization

I should keep it concise but substantive. Given the user's profile (values accuracy and deep logic analysis), and reference files with clickable links.

Let me organize the findings by file/layer.

Key structural facts:
- Hand-rolled mini component framework (Component.js) with string-based HTML generation (`getHtml`) AND direct DOM manipulation (`updateElement`/`createElements`). Two parallel rendering paths — the string path (`updateHtml`, `getHtml`, `getStyleHtml`) is mostly dead/legacy and partly broken.
- Global callback registry `callbacklist` + global `callback()` function referenced from inline `onclick` attribute strings.
- ComponentInteractive.js: interactive behavior mixed into the component hierarchy via inheritance (InteractiveItem → Input/CheckBox/DropDown), plus a table interaction model (InteractionModel/Interacter/TableInteracter2).
- PageUI.js: page composition + domain/statistics logic (BlockInfoUI, ChronoStatUI, getValidEvents, getPrice...). Business logic mixed with view.
- CommandUI.js: command entry, tag probability model, multi/pile UIs.
- index.html: all the app glue, AJAX polling, message playback, config, all inline in a <script>.

Antipatterns:
1. Two rendering systems; dead/string HTML path with bugs (`this.html+=` accumulation in Span/DivItem/Input; `Link.updateHtml`).
2. Global mutable state everywhere (dataobj, pageUI, appConfig, currentcommandUI, loading, init, cacheddata, messageQueue...) — implicit globals `userActionPending`, `ptobj`. No module scoping.
3. Global string-callback registry: `registerCallback(id, fn)` + inline `onclick="callback('id')"`. Leaks handlers (never unregistered), id collisions.
4. God classes / mixed responsibilities: BlockInfoUI, ChronoStatUI, HarvestGraphUI each re-parse the data file independently; getValidEvents is global but each consumer reimplements species mapping.
5. Duplicate data-parsing logic: the "block history / cancel resolution" algorithm implemented at least 4 times: getValidEvents (PageUI), applyCancels (PageUI), TagProbabilityModel.extractCommandsFromBlockHistory, extractTagsFromBlockHistory, buildModel inline. Also speciesMap built in both HarvestGraphUI.update, ChronoStatUI.makeChronoData, BlockInfoUI.buildHarvestBlocks.
6. Data-shape fragility: keys like `"1/command"`, `p1/0/command` parsed by string index math (getMultiindex/getPileindex). `.endsWith(key)` matching for data keys (LineUI.update) is ambiguous.
7. Copy-paste: the 5 checkbox handlers in CommandUI (saveonset, disablegenerate, disablerfididsave, multiChanged, transientTagChanged) are near-identical; the date-validation block in set()/setPile()/CommandMultiUI.set() is triplicated; the tag-button creation in createTagButtons/refreshTagButtons duplicated.
8. updateElement recursively notifies `change` events on every update → cascading re-renders and event storms; also `applyProperties` writes to DOM unconditionally in places, and logging noise (`console.log()` no-arg).
9. Deprecated/broken code left in: `setContent` "not used", `freezeElement` "variable not used", `TableInteracter2` with heavy console.log, `row.row.setStyle` in CommandMultiUI.addRow (`line.row.setStyle` where line is already a row), `MultiLineUI` legacy commented block. `Table.clear()` uses `this.subitems.back()`, `Table.getCell/getRow` call arrays as functions.
10. Sync XHR in HarvestGraph.loadPrices (blocking), plus the same prices loaded 3 ways (PageUI loadRemote prices.json, HarvestGraph own sync load, PriceUI).
11. Mixed date parsing implementations (parseToDate, isStrictDMYY, formatDateToDMYY, formatToDMYY duplicate, parseBootTimeString, getBlockAgeWeeks, HarvestGraph.parseDate) — many overlapping.
12. String-typed styles objects manually set one-by-one (comp.setStyle("x","y") repeatedly) — verbose; could be class names/CSS.
13. Naming inconsistencies: `getKeyStyle`/`getValueStyle` duplicate between LineUI and BlockInfoUI; `MultiLineUI.update`/`updateFile` call undefined (`this.lineui`) — dead code paths.
14. Error handling: `.bind(this)` on undefined (err.bind when err undefined in loadRemote line 103). Actually `loadRemote`: `if (this.status != 200) err.bind(this)();` — if err is undefined → throws. Also `if (err) xhttp.addEventListener("error", err)`.

Patterns to recommend:
- Single rendering path (drop the string-HTML path or the DOM path, not both).
- ES modules / IIFE namespacing to eliminate globals; a small `App`/`Store` object to hold shared state (dataobj, appConfig) instead of globals.
- Replace global callback registry with `addEventListener` closures (already partly done via addListener) — kill inline `onclick="callback(...)"`.
- Extract a shared `model/` layer: `parseDataFile()` → structured events/blocks once; `resolveCancels`, `blocksWithSpecies`, `priceFor()`, date utils. Feed all UIs from one parsed model.
- One canonical date-utility module.
- Replace `setStyle` calls with CSS classes + a `class()` API on components.
- Configuration-driven field definitions (the repeated addListener/validation blocks per key) — a field-spec table.
- Table/row key parsing: parse `multi`/`pile` indexes once into arrays rather than string math.
- Consolidate the checkbox pattern into a `ConfigCheckbox` component.
- Avoid `setInterval(loadjson, 1000)` polling → keep but centralize; not the point.

I should also mention the build pipeline (buildUI.js concats JS referenced by <script src> tags in index.html) — so file organization is constrained: order matters, global scope shared, no imports. That's an important organizational constraint to call out and could motivate IIFE/module.

Now let me verify a couple claimed bugs to avoid inaccuracy:
- `Span.updateHtml(){this.html+="<span ...>"}` → yes accumulates. But is updateHtml ever called? `getHtml()` calls updateHtml then returns html. `getHtml` may not be used. The DOM path `updateElement` is what's used. So string path is dead. I'll frame as "dead/legacy path with latent bugs" rather than "active bug".
- `ComponentNode.removeListener` bug: `for(let i=rem[rem.length-1];i>=0;i++)` — yes loop bug; but removeListener may be unused. I'll mention as latent.
- `updateIpLink` uses `tobj.config.IP` but the json uses `ip`. Let me double check the sample: `"config":{"boottime":...,"ip":"192.168.2.15",...}`. Yes key is lowercase `ip`. So `ipAddressLink` stays hidden → dead feature. Worth mentioning. (Though maybe device sends "IP"? Sample says ip. I'll note as likely mismatch.)

Let me be measured: I'll flag as "likely bug — verify".

- `Table.clear()` `this.subitems.back()` — Array has no back(). Confirmed bug in dead-ish path.
- `CommandMultiUI.addRow`: `line.row.setStyle(...)` — line is result of `clineui.addAsRow` which returns `this.row` (a TableRow / LineUI?). Actually addAsRow returns `this.row` where this.row = multilineui.addRow(this.data) → LineUI. So `line.row` is undefined → `line.row.setStyle` throws! Wait: `var line = clineui.addAsRow(this.multilineui);` addAsRow returns `this.row` (LineUI instance from MultiLineUI.addRow). So `line` is a LineUI. Then `line.row.setStyle(...)` — LineUI has `.row` (a TableRow). Yes LineUI.row exists. OK not a bug. Good, don't report.
- `MultiLineUI.updateFile` uses `this.lineui` (undefined) → would throw if called. Is it called? CommandMultiUI.updateFile calls commandlineuis[i].updateFile → CommandLineUI.updateFile → this.row.updateFile → LineUI.updateFile → updateTags. MultiLineUI.updateFile is separate and calls this.lineui.updatefile — likely never called. Latent dead bug.
- `CommandLineUI.getArgURL` iterates `this.row.valuecomps` and compares `utext != this.data[k]` — data is indexed by key here, ok.
- `LineUI.update`: `for (let k in this.valuecomps) if (dkey.endsWith(k))` — dkey like "data/command"? Actually data has keys "date","id","command","argument". dkey endsWith k works but ambiguous (e.g., "id" is a suffix of "blockdate"? no). Could misfire: "date" vs "blockdate" - endsWith("date") true for "blockdate"! In the `data` object keys are just date/id/command/argument though. In multi, keys are "1/command" etc. so endsWith works. Fragile but works. Mention.

- `User input` whitespace: ok.

Also note: `ComponentItem.updateHtml` sets `this.html=this.text` but many subclasses never use, and `getHtml` not used since DOM path is primary. Good.

Also `index.html` `setDisabledIds` uses substring indexOf for iOS hack; fine.

Another global: `var ptobj = Object.assign({}, tobj);` assigned without declaration? line 227 `ptobj = Object.assign(...)` — no var. Implicit global (works in sloppy mode). Mention.

Also `enableloadjson`/`loadjson`/`disenableload` toggle `geid("content").disabled` — fine.

Also the polling: `setInterval(loadjson, 1000)` and `loadRemote` sets `loading`. `enableloadjson` checks `loading` global. Reasonable.

Also note `loadRemote` error handling bug: when status != 200 and err undefined → TypeError. In `disenableload`, custerr may be undefined but fe is always defined (passed as err). Actually disenableload always passes fe. `loadjson` passes error fn. `loadRemote('config.json', f, f2)`. All pass err. But `loadRemote` signature has err required; safe-ish. Minor.

Let me also mention the Path: `data/` folder contains gzipped built output; source in `alldata/`. Good — mention build constraint.

I think I have plenty. Let me write the review.

I'll structure:
1. Architecture at a glance (layers, data flow) — with file links.
2. Antipatterns (grouped, with code refs).
3. Patterns / refactors to consider (table).
4. Suggested priority.

Keep it focused and reference lines. Use file:/// links.

Let me get accurate line numbers for key refs:
- Component.js: string render path getHtml/getStyleHtml L15-29, L44-50; callback registry L204-210; applyProperties L155-179; updateElement L181-191; removeListener bug L101-107; Span.updateHtml L283; Table.clear L438-444; getCell/getRow L400-401.
- ComponentInteractive.js: InteractiveItem L9-89; updateFromUser L26-51; TableInteracter2 L693-745 (console spam).
- PageUI.js: getValidEvents L21-85; applyCancels L87-117; getPrice L632-647; BlockInfoUI.buildHarvestBlocks L249-282; ChronoStatUI.makeChronoData L816-847; HarvestGraphUI.update L915-960; PageUI.createPage L979-1008.
- CommandUI.js: TagProbabilityModel L614-1067; LineUI.createUI L315-519; checkbox handlers L2032-2080; set/setPile/CommandMultiUI.set duplicate L2083-2112, L1525-1553, L1316-1344; createTagButtons/refreshTagButtons L1766-1871; date utils L2139-2267.
- index.html: globals L316-369, L415-419, L491; userActionPending L150; ptobj L227; loadRemote L98-109; polling startScript L370-412; message playback L414-650; updateIpLink L259-284.

Good. Write it up.

I'll write in English (user's message is English).

Keep reasonably concise but complete. Use a table for patterns.
I've read the full client UI (`alldata/`). Here's my review.

## 1. Architecture at a glance

The UI is a **hand-rolled component framework** plus page/section classes, all loaded as plain scripts and concatenated by [buildUI.js](file:///c:/Users/Shpok/Documents/Arduino/superscale/buildUI.js) into one bundle:

| Layer | File | Responsibility |
|---|---|---|
| Component model | [Component.js](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/Component.js) | `Component → ComponentNode → ComponentItem` tree; `Table`, `Span`, `Link`, `Select`, `DataList` |
| Interactive widgets | [ComponentInteractive.js](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/ComponentInteractive.js) | `Input`, `CheckBox`, `DropDown`, `Button`, and the table `InteractionModel`/`Interacter` select-highlight system |
| Page composition + stats | [PageUI.js](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/PageUI.js) | `PageUI`, `ScaleUI`, `BlockInfoUI`, `ChronoStatUI`, `WifiUI`, `DiskUI`, `HarvestGraphUI` |
| Command entry | [CommandUI.js](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/CommandUI.js) | `CommandUI`, `LineUI`, `CommandMultiUI`, `CommandPileUI`, `TagProbabilityModel` |
| Graph | [HarvestGraph.js](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/HarvestGraph.js) | Chart.js wrapper |
| App glue | [index.html](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/index.html) | polling loop, AJAX, message playback, global state |

Data flow: `setInterval(loadjson, 1000)` → `/json` → `reqListener()` → `PageUI.update()` → each section's `update()`. The datafile (`data.txt`) is loaded separately and dispatched through `PageUI.updateDataFile()`.

**Key constraint:** because the build concatenates `<script src>` files in order and there is no module system, *everything shares one global scope and load order matters*. This single fact drives most of the antipatterns below.

---

## 2. Antipatterns

### 2.1 Two parallel rendering systems, one of them dead and buggy
The framework generates HTML twice: a **string path** (`getHtml`/`updateHtml`/`getStyleHtml`, [Component.js:L15-L50](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/Component.js#L15-L50)) and a **direct-DOM path** (`createElements`/`applyProperties`/`updateElement`, [L133-L191](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/Component.js#L133-L191)). Only the DOM path is actually used, yet the string path is still maintained and is latently broken:
- `Span.updateHtml` / `DivItem.updateHtml` / `Input.updateHtml` use `this.html += …`, so repeated calls accumulate garbage ([L283](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/Component.js#L283), [L299](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/Component.js#L299)).
- `Table.clear()` calls `this.subitems.back()` — `Array.prototype.back()` doesn't exist ([L440](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/Component.js#L440)).
- `Table.getCell/getRow` invoke an array as a function ([L400-L401](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/Component.js#L400-L401)).
- `ComponentNode.removeListener` loops `i++` from a splice index — wrong direction ([L101-L107](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/Component.js#L101-L107)).

### 2.2 Global mutable state as the de-facto app store
Shared state lives in loose globals across files: `dataobj`, `appConfig` ([index.html:L367-L369](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/index.html#L367-L369)), `currentcommandUI` ([CommandUI.js:L1614](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/CommandUI.js#L1614)), `loading`/`loadingData`/`init`, `cacheddata`, `messageQueue` ([index.html:L415-L419](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/index.html#L415-L419)). Two are **undeclared implicit globals**: `userActionPending` ([L150](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/index.html#L150)) and `ptobj` ([L227](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/index.html#L227)) — they work only in sloppy mode and become bugs the moment anything is a module or strict.

### 2.3 Global string-keyed callback registry
[Component.js:L204-L210](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/Component.js#L204-L210) registers handlers by id into a global `callbacklist` and emits inline `onclick="callback('id',event)"`. This is a parallel, redundant event system on top of `addListener`, and it can't be un-registered (leaks on every `refreshTagButtons`, [CommandUI.js:L1822-L1871](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/CommandUI.js#L1822-L1871)) and silently overwrites on id reuse.

### 2.4 The same data-parsing logic reimplemented many times
The "block history, respecting `cancel`" algorithm exists at least **five** times:
- `getValidEvents` ([PageUI.js:L21-L85](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/PageUI.js#L21-L85)) and `applyCancels` ([L87-L117](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/PageUI.js#L87-L117))
- `TagProbabilityModel.buildModel` inline ([CommandUI.js:L691-L735](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/CommandUI.js#L691-L735)), `extractCommandsFromBlockHistory` ([L1003-L1033](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/CommandUI.js#L1003-L1033)), `extractTagsFromBlockHistory` ([L1036-L1066](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/CommandUI.js#L1036-L1066))

Likewise the `id → species` map is rebuilt independently in `BlockInfoUI.buildHarvestBlocks`, `ChronoStatUI.makeChronoData` ([PageUI.js:L816-L847](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/PageUI.js#L816-L847)) and `HarvestGraphUI.update` ([PageUI.js:L915-L960](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/PageUI.js#L915-L960)), and `prices.json` is loaded three different ways (async `loadRemote`, HarvestGraph's **synchronous XHR** [HarvestGraph.js:L285-L319](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/HarvestGraph.js#L285-L319), and `getPrice`). These can drift out of sync.

### 2.5 God classes; view and domain logic mixed
`BlockInfoUI` ([PageUI.js:L157-L467](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/PageUI.js#L157-L467)) owns table layout, price math, formula-signature similarity, block-age calc and statistics. `ChronoStatUI` builds DOM *and* computes per-day/business aggregates and generates HTML strings. `TagProbabilityModel` ([CommandUI.js:L614-L1067](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/CommandUI.js#L614-L1067)) is ~450 lines of pure math buried in the UI file.

### 2.6 Copy-paste blocks
- Five near-identical checkbox handlers: `saveonset`, `disablegenerate`, `disablerfididsave`, `multiChanged`, `transientTagChanged` ([CommandUI.js:L2032-L2080](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/CommandUI.js#L2032-L2080)).
- The "date field invalid → `alert` → return" guard is triplicated (`CommandUI.set` [L2083-L2112](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/CommandUI.js#L2083-L2112), `CommandPileUI.setPile` [L1525-L1553](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/CommandUI.js#L1525-L1553), `CommandMultiUI.set` [L1316-L1344](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/CommandUI.js#L1316-L1344)).
- `createTagButtons` and `refreshTagButtons` are the same code twice ([L1766-L1871](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/CommandUI.js#L1766-L1871)).
- `LineUI.createUI` attaches ~8 listeners per field with per-key `if (key === …)` branches ([L315-L519](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/CommandUI.js#L315-L519)) — a field table would express this once.

### 2.7 Date handling sprawl
`parseToDate`, `formatToDMYY`, `formatDateToDMYY` (identical to `formatToDMYY`), `standardizeDateString`, `isStrictDMYY` ([CommandUI.js:L2139-L2267](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/CommandUI.js#L2139-L2267)), plus `parseDate` in HarvestGraph, `parseBootTimeString` in index.html, and `getBlockAgeWeeks`. Same concern, many implementations, slightly different year-pivot rules.

### 2.8 Fragile key parsing
`multi`/`pile` keys like `"1/command"`, `"p1/0/command"` are decoded with index math (`getMultiindex` [L1290-L1296](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/CommandUI.js#L1290-L1296), `getPileindex` [L1576-L1580](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/CommandUI.js#L1576-L1580)) and matched with `dkey.endsWith(key)` ([L134](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/CommandUI.js#L134)). `endsWith` is ambiguous (`"blockdate".endsWith("date")`).

### 2.9 Dead code and debug noise
Commented-out legacy blocks throughout, `setContent` marked "not used", `freezeElement` "variable not used" ([Component.js:L32](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/Component.js#L32), [L87](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/Component.js#L87)), `TableInteracter2` full of `console.log` dumps ([ComponentInteractive.js:L693-L745](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/ComponentInteractive.js#L693-L745)), `console.log()` no-arg calls as accidental traces ([Component.js:L137](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/Component.js#L137), [L177](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/Component.js#L177)). Live-ish bugs: `Console.log` (capital C) [CommandUI.js:L1165](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/CommandUI.js#L1165), and `MultiLineUI.updateFile` reads `this.lineui` which never exists ([L575](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/CommandUI.js#L575)).

### 2.10 Likely real bug: IP link never shows
`updateIpLink` reads `tobj.config.IP` ([index.html:L260](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/index.html#L260)) but the payload uses lowercase `ip` (see the sample at [L212](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/index.html#L212)). Worth confirming — the IP link appears permanently hidden.

### 2.11 Rendering storms
`updateElement` unconditionally recurses into all children and fires a synthetic `change` event on every node ([Component.js:L181-L191](file:///c:/Users/Shpok/Documents/Arduino/superscale/alldata/Component.js#L181-L191)). Combined with `refreshTagButtons` destroying/recreating DOM (without unregistering the global callbacks) this causes redundant work and handler leaks each poll tick.

---

## 3. Patterns that would make it clearer

| Problem area | Suggested pattern |
|---|---|
| Two render paths | Keep only the DOM path; delete the string-HTML generator (`getHtml`/`updateHtml`/`getStyleHtml`) |
| Global app state + implicit globals | One `store` object (or IIFE namespace) holding `data/appConfig/loading`; start using `"use strict"` or ES modules |
| String callback registry | Drop `registerCallback`/inline `onclick`; use `addEventListener` + a `dispose()` on components |
| 5× cancel/history parsing | A single `HistoryModel` module: `parse(datafile) → {events, blocks, speciesById, argsByCommand}` computed once per datafile, consumed by all UIs |
| Duplicate species/price logic | One `pricing` module + one async `loadPrices()` shared by all three consumers |
| God classes | Split `BlockInfoUI`/`ChronoStatUI`/`TagProbabilityModel` into `stats/*` (pure functions) + thin view classes |
| Repeated checkbox handlers | A `ConfigCheckbox(key, url)` component that owns the pchecked/diff/disenableload pattern |
| Triplicated date guard | One `validateDateFields(row)` helper, or fold into field validation |
| Per-key listener branches | A field-spec table `[{key,type,validators,listeners}]` driving `createUI` |
| Fragile key parsing | Normalize `multi`/`pile` into arrays once (`{index, field, value}`) instead of `endsWith`/index math |
| Date sprawl | One `dateUtils` module (parse/format/age) with a single year-pivot rule |
| Verbose styling | Replace `setStyle(...)` chains with CSS classes + a `className()` API |
| Debug noise | Gate logs behind the existing `DEBUG_PROBABILITY_MODEL` pattern (or a shared `log` helper); delete `console.log()` no-args |

---

## 4. Suggested priority

1. **Cheap, safe cleanups:** remove dead string-render path + commented legacy blocks; fix `userActionPending`/`ptobj` declarations; fix `Console.log`, `this.lineui`, confirm the `config.IP` key.
2. **Highest leverage:** extract the single `HistoryModel` (kills the 5× parser duplication and the 3× species map) and a shared price loader.
3. **De-duplication in CommandUI:** the checkbox handler factory, the date-guard helper, and merging `createTagButtons`/`refreshTagButtons`.
4. **Structural:** introduce a module/namespace boundary (even IIFEs) so files stop sharing one mutable global scope; split stats/probability math out of the view files.

Want me to start with any of these? I'd recommend step 2 (the `HistoryModel` extraction) as the biggest clarity win, or step 1 if you want a quick, low-risk first diff