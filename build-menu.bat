@echo off
setlocal
cd /d "%~dp0"
title SuperScale Build Menu

:menu
cls
echo ==============================================================
echo   SuperScale   BUILD and TOOLS MENU
echo   Folder: %CD%
echo ==============================================================
echo.
echo   --- BUILD  (source: alldata\   output: data\ ) ---
echo.
echo     [1] Build ALL: main UI + all VIZ pages     npm run build-all
echo     [2] Build main UI only (index.html)        node buildUI.js
echo     [3] Build ALL VIZ pages                    npm run build-viz
echo     [4] Build ONE VIZ page (choose from list)
echo.
echo   --- SETUP / INFO ---
echo.
echo     [5] Install npm dependencies               npm install
echo     [6] Show built output files (with sizes)
echo.
echo   --- DATA TOOLS (Python) ---
echo.
echo     [7] Clean data file                        clean_datafile.py
echo         in:  alldata\data.txt
echo         out: alldata\data_cleaned.txt
echo     [8] Find duplicate sequences               find_duplicates.py
echo.
echo   --- GIT ---
echo.
echo     [9] Git COMMIT + PUSH (choose project)     ..\commit-projects.cmd
echo.
echo     [0] Exit
echo.
set "choice="
set /p "choice=Choose an option [0-9]: "

if "%choice%"=="1" goto all
if "%choice%"=="2" goto ui
if "%choice%"=="3" goto vizall
if "%choice%"=="4" goto oneviz
if "%choice%"=="5" goto install
if "%choice%"=="6" goto sizes
if "%choice%"=="7" goto clean
if "%choice%"=="8" goto dups
if "%choice%"=="9" goto commit
if "%choice%"=="0" goto end
goto menu


REM ================= BUILD ALL =================
:all
cls
where node >nul 2>nul
if errorlevel 1 goto nonode
echo Running: npm run build-all
echo (buildUI.js  then  build-viz: BlockViz, TableView, SavedRequestsGraphic)
echo.
call npm run build-all
echo.
pause
goto menu


REM ================= MAIN UI =================
:ui
cls
where node >nul 2>nul
if errorlevel 1 goto nonode
echo Running: node buildUI.js
echo (alldata\index.html + its scripts  -^>  data\index.html.gz + data\bundle-min.js.gz)
echo.
call node buildUI.js
echo.
pause
goto menu


REM ================= ALL VIZ =================
:vizall
cls
where node >nul 2>nul
if errorlevel 1 goto nonode
echo Running: npm run build-viz
echo (BlockViz.html, TableView.html, SavedRequestsGraphic.html  -^>  data\viz\*.gz)
echo.
call npm run build-viz
echo.
pause
goto menu


REM ================= ONE VIZ =================
:oneviz
cls
set "v="
set "vizfile="
echo   Build ONE VIZ page   (source: alldata\viz\   output: data\viz\ )
echo.
echo     [1] BlockViz.html
echo     [2] TableView.html
echo     [3] SavedRequestsGraphic.html
echo     [c] Other file name in alldata\viz\
echo     [b] Back to menu
echo.
set /p "v=Choose: "

if /i "%v%"=="b" goto menu
if /i "%v%"=="1" set "vizfile=BlockViz.html"
if /i "%v%"=="2" set "vizfile=TableView.html"
if /i "%v%"=="3" set "vizfile=SavedRequestsGraphic.html"
if /i "%v%"=="c" set /p "vizfile=HTML file name (e.g. MyPage.html): "

if not defined vizfile goto oneviz

where node >nul 2>nul
if errorlevel 1 goto nonode
echo.
echo Running: node buildVizFile.js %vizfile%
echo.
call node buildVizFile.js %vizfile%
echo.
pause
goto menu


REM ================= INSTALL =================
:install
cls
where npm >nul 2>nul
if errorlevel 1 goto nonode
echo Running: npm install
echo.
call npm install
echo.
pause
goto menu


REM ================= OUTPUT SIZES =================
:sizes
cls
echo   Built output files
echo ==============================================================
echo.
echo [data\]  (main UI, served by the device)
echo --------------------------------------------------------------
dir "data\*.gz" 2>nul
echo.
echo [data\viz\]  (visualization pages)
echo --------------------------------------------------------------
dir "data\viz\*.gz" 2>nul
echo.
pause
goto menu


REM ================= CLEAN DATA FILE =================
:clean
cls
where python >nul 2>nul
if errorlevel 1 goto nopython
echo Running: python clean_datafile.py
echo.
echo Removes "cancel" commands and their targets, normalizes dates to D/M/YY,
echo drops successive identical lines. Paths are fixed inside the script.
echo   in:  alldata\data.txt
echo   out: alldata\data_cleaned.txt
echo.
python clean_datafile.py
echo.
pause
goto menu


REM ================= FIND DUPLICATES =================
:dups
cls
where python >nul 2>nul
if errorlevel 1 goto nopython
echo Usage: python find_duplicates.py ^<file_path^> [min_sequence_length]
echo Example: python find_duplicates.py alldata\data.txt 3
echo.
set "dupin="
set /p "dupin=Data file path (Enter = alldata\data.txt): "
if not defined dupin set "dupin=alldata\data.txt"
set "duplen="
set /p "duplen=Min sequence length (Enter = 3): "
if not defined duplen set "duplen=3"
echo.
python find_duplicates.py "%dupin%" %duplen%
echo.
pause
goto menu


REM ================= GIT COMMIT + PUSH =================
:commit
cls
set "p="
set "ctarget="
echo   Git COMMIT and PUSH   (script: ..\commit-projects.cmd)
echo.
echo     [1] superscale           (this project)
echo     [2] all                  (ioktopuslib, superscale, RfidRemoteControl)
echo     [3] ioktopuslib
echo     [4] RfidRemoteControl
echo     [b] Back to menu
echo.
echo   Note: stages ALL changes, commits, then pushes to the configured remote.
echo.
set /p "p=Choose: "

if /i "%p%"=="b" goto menu
if /i "%p%"=="1" set "ctarget=superscale"
if /i "%p%"=="2" set "ctarget=all"
if /i "%p%"=="3" set "ctarget=ioktopuslib"
if /i "%p%"=="4" set "ctarget=RfidRemoteControl"

if not defined ctarget goto commit

if not exist "%~dp0..\commit-projects.cmd" (
    echo.
    echo  !! commit-projects.cmd not found in the parent folder:
    echo     %~dp0..
    echo.
    pause
    goto menu
)

set "cmsg="
set /p "cmsg=Commit message (Enter = default: Update ^<project^> files): "
echo.
echo Running: commit-projects.cmd %ctarget%
echo.
if defined cmsg (
    call "%~dp0..\commit-projects.cmd" %ctarget% -Message "%cmsg%"
) else (
    call "%~dp0..\commit-projects.cmd" %ctarget%
)
echo.
pause
goto menu


REM ================= MESSAGES =================
:nonode
echo.
echo  !! Node.js / npm was not found in PATH.
echo     Install Node.js first: https://nodejs.org
echo.
pause
goto menu

:nopython
echo.
echo  !! Python was not found in PATH.
echo     Install Python 3 and make sure "python" works in a terminal.
echo.
pause
goto menu

:end
endlocal
exit /b 0
