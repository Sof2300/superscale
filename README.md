# SuperScale

SuperScale is an ESP32-based smart weighing and logging application for small-scale harvesting, markets, and DIY projects. It reads a load cell (HX711), provides a simple local UI (optionally via TFT), physical buttons, and a built-in HTTP server + sync engine to view and manage data from a browser or remote client.

## Key Features
- Real-time weight reading via HX711.
- Local UI support (optional TFT via `TFTManager`).
- Physical button shortcuts: save, tare, price/aggregation controls and screen switching.
- Persistent file storage using `SimpleFS` (`/data.txt`, `/headers.txt`, `/config.json`, `/prices.json`).
- Block / history aggregation and derived statistics via `BlockInfoManager`.
- Multi-save and pile (batch) operations via `MultiManager` and `PileManager`.
- HTTP API for remote control and browser UI (endpoints listed below).
- Robust remote sync engine (chunked delta push/pull, CRC checks, patching) implemented in `RemoteSyncServer`.

## Hardware (typical)
- MCU: ESP32 (project uses ESP32-specific APIs and FreeRTOS).
- Load cell (HX711) pins (configured in `superscale.ino`):
  - DOUT: 27
  - SCK: 26
- Buttons (pins from `superscale.ino`):
  - Save: 33
  - Tare: 12
  - Price: 32
  - Screen switch: 0
  - Price change: 35
- Buzzer: pin 25

See [superscale.ino](superscale.ino) for the exact pin defines and button handlers.

## Important Files
- [superscale.ino](superscale.ino) — main sketch and initialization.
- [superscale.c++](superscale.c++) — supplemental C++ code (project contains helper code).
- [DataManager.h](DataManager.h) — core data model, save/load logic, REST handlers integration.
- [BlockInfoManager.h](BlockInfoManager.h) — per-block history aggregation and statistics.
- [RemoteSyncServer.h](RemoteSyncServer.h) — server-side sync protocol (sync_check, sync_download, sync_push_delta, sync_patch).
- [Managers.h](Managers.h) — WiFi and config managers, `ConfigManager` and `WifiSubMan`.
- [TFTManager.h](TFTManager.h) — optional TFT display helpers (if `USE_TFT` enabled).
- `lib/` — supporting libraries (filesystem, networking, device drivers, datastruct helpers).

## Browser Client (Web UI)
The repository includes a browser-based client (HTML/JS) used to interact with the device from a browser. Two folders contain the client and related assets:

- `alldata/` — compact/minified bundle and example pages. Key files: `index.html`, `index-max.html`, `bundle-min.js`, `bundle.js`, `Component.js`, `PageUI.js`, `CommandUI.js`, and related app scripts.
- `data/` — alternate web UI and assets used historically; also contains `index.html`, `prices.json`, `data.csv` and supporting JS.

You can open the HTML files directly in a browser for local testing, or deploy the contents to a static webserver. The client communicates with the device's HTTP API (see "HTTP API / Endpoints") to read live `json` data, send `/set` and `/save` requests, and perform sync operations.

Note: the canonical, production web UI used by the device is in the `data/` folder — this is the primary client shipped with the app. The `alldata/` folder contains debug, development and minified bundles (examples and testing pages such as `index-max.html` and `bundle-min.js`).

Refer to `data/index.html` and the JS files in `data/` for the main client implementation; use `alldata/` for debugging and development artifacts.

## HTTP API / Endpoints
The device exposes a number of endpoints through the built-in `BasicServer`. High-level endpoints include:

- Data & control: `/set`, `/setBypass`, `/save`, `/tare`, `/undo`, `/generateID`, `/json`, `/clear`, `/clearAll`, `/filewrite`, `/deleteDataFile`
- Multi/pile: endpoints provided by `MultiManager` and `PileManager` (see `DataManager::getUrlNames`).
- Prices / screen controls (if TFT enabled): `/price/clear`, `/price/add`, `/price/set`, `/price/setsum`, `/price/json`, `/price/select`, `/price/screen`.
- Remote sync (file synchronization endpoints by `RemoteSyncServer`): `/sync_check`, `/sync_push_delta`, `/sync_download_delta`, `/sync_download`, `/sync_patch`.

Clients (browser UI or scripts) interact with these endpoints to set fields, trigger saves, request JSON dumps, and synchronize the main data file.

## Data files & layout
- Main logged data: `/data.txt` (CSV-like append-only log)
- Headers: `/headers.txt` (defines order of fields in each data line)
- Configuration: `/config.json` (saved by `ConfigManager`)
- Prices: `/prices.json`
- RFID mapping (optional): `RFID2ID.csv`

Storage is handled by a thin filesystem abstraction `SimpleFS` (see `lib/fs`). Take care when editing these files while the device is running.

## Remote sync details
`RemoteSyncServer` implements a file synchronization protocol that supports:

- `sync_check` — compare client base+total sizes and CRC to decide PUSH vs PULL vs FULL update.
- `sync_push_delta` — chunked push of appended data with atomic checks.
- `sync_download_delta` — server-side delta download range support.
- `sync_download` — full file download.
- `sync_patch` — server-side patching of in-place content with Content-Range and If-Match CRC checks.

The server uses CRC checks over the prefix/checkpoint to detect divergence and prevent accidental corruption.

## Configuration
- Default WiFi SSID/password are defined in `superscale.ino` but device will load `/config.json` at startup via `ConfigManager`.
- Important config keys: `mode` (ST/AP), `ssid`, `password`, `mdns` (mDNS hostname), `defaultcommand`.

## TFT / UI
If `USE_TFT` is enabled the project will initialize `TFTManager`, `TFTPrice` and `TFTConsole` to show realtime values, history and price screens. Button handlers push interactions to the `DataManager` and `PriceManager`.

## Build & Upload
1. Open the project in the Arduino IDE or PlatformIO.
2. Select an ESP32 board and the correct port.
3. Make sure dependencies/libraries in `lib/` are available (project includes local `lib/` sources).
4. Compile and upload.

Example (PlatformIO settings are project-specific):

```bash
# Arduino IDE: open superscale.ino and Upload
# PlatformIO: configure `platformio.ini` for your ESP32 target and run:
platformio run -t upload
```

## Troubleshooting & Notes
- Some operations read large files in chunks to avoid memory exhaustion — please be patient on large logs.
- There are known UX and corner-case bugs logged in the project comments inside `superscale.ino` (search for TODO/Bugs).
- If the device appears stuck connecting WiFi, check the `mode` setting in `/config.json` and verify stored `ssid`/`password`.

## Contributing
- Pull requests welcome. Focus on small, well-tested changes.
- When changing the on-disk format (`/data.txt`), update `BlockInfoManager` and `findHighestID` helpers.

## License & Credits
See the repository `LICENSE` file for licensing terms.

---
This README was generated from the repository source files. For implementation details refer to the files listed above.
