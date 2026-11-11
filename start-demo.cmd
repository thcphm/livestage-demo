@echo off
rem Double-click to run the LiveStage demo locally. Close this window to stop it.
rem Runs a production build (fast, no dev error overlay) kept in .next-demo, rebuilt when the code changes.
chcp 65001 >nul
cd /d "%~dp0"
set NEXT_DIST_DIR=.next-demo
set NEXT_TELEMETRY_DISABLED=1
set URL=http://localhost:3000/en

node -v >nul 2>&1
if errorlevel 1 goto :no_node

netstat -ano | findstr /r /c:":3000 .*LISTENING" >nul
if not errorlevel 1 goto :port_busy

if exist "node_modules\next\dist\bin\next" goto :deps_ok
echo Dang cai thu vien lan dau, mat vai phut...
call npx.cmd --yes pnpm@10 install
if errorlevel 1 goto :failed
:deps_ok

set HEAD=none
for /f %%h in ('git rev-parse HEAD 2^>nul') do set HEAD=%%h
set BUILT=
if exist ".next-demo\demo-head.txt" set /p BUILT=<".next-demo\demo-head.txt"
if not exist ".next-demo\BUILD_ID" set BUILT=
if "%HEAD%"=="%BUILT%" goto :start

echo Dang chuan bi ban demo - lan dau hoac sau khi cap nhat mat khoang 1-2 phut...
node "node_modules\next\dist\bin\next" build
if errorlevel 1 goto :failed
>".next-demo\demo-head.txt" echo %HEAD%

:start
echo.
echo LiveStage demo dang chay. Trinh duyet se tu mo.
echo Neu khong tu mo, vao: %URL%
echo Dong cua so nay de tat demo.
echo.
start "" cmd /c "timeout /t 4 /nobreak >nul & start %URL%"
node "node_modules\next\dist\bin\next" start -p 3000
pause
exit /b 0

:no_node
echo Chua cai Node.js. Tai ban LTS tai https://nodejs.org roi chay lai file nay.
pause
exit /b 1

:port_busy
echo Cong 3000 dang duoc dung boi mot cua so khac - thuong la lan chay truoc chua tat.
echo Hay dong cua so do roi nhap dup lai file nay.
pause
exit /b 1

:failed
echo Co loi khi chuan bi demo. Chup man hinh cua so nay gui cho nguoi ho tro ky thuat.
pause
exit /b 1
