@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

set DURATION=%~1
if "%DURATION%"=="" set DURATION=30

set OUTDIR=%~2
if "%OUTDIR%"=="" set OUTDIR=%cd%

:: Get date/time using PowerShell (reliable across locales)
for /f %%i in ('powershell -c "Get-Date -Format 'yyyy-MM-dd HH:mm'"') do set TIMESTAMP=%%i
for /f %%i in ('powershell -c "Get-Date -Format 'yyyyMMdd_HHmmss'"') do set FILE_TS=%%i

:: Escape colon for FFmpeg
set TIMESTAMP_ESC=%TIMESTAMP::=\:%

echo === Test Video Generator ===
echo Duration: %DURATION%s
echo Output: %OUTDIR%
echo.

echo Generating 1080p Landscape (1920x1080)...
ffmpeg -f lavfi -i "color=c=black:s=1920x1080:d=%DURATION%" -vf "drawtext=text='%%{pts\:hms}':fontsize=120:fontcolor=white:x=(w-text_w)/2:y=h/2-120,drawtext=text='%TIMESTAMP_ESC%':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=h/2+20,drawtext=text='1080p Landscape':fontsize=32:fontcolor=gray:x=(w-text_w)/2:y=h/2+100" -c:v libx264 -pix_fmt yuv420p -y "%OUTDIR%\test_horizontal_%FILE_TS%.mp4" 2>nul
if !errorlevel!==0 (
    echo   -^> test_horizontal_%FILE_TS%.mp4 [OK]
) else (
    echo   -^> Failed!
)

echo Generating 9:16 Portrait (1080x1920)...
ffmpeg -f lavfi -i "color=c=black:s=1080x1920:d=%DURATION%" -vf "drawtext=text='%%{pts\:hms}':fontsize=100:fontcolor=white:x=(w-text_w)/2:y=h/2-100,drawtext=text='%TIMESTAMP_ESC%':fontsize=40:fontcolor=white:x=(w-text_w)/2:y=h/2+20,drawtext=text='9\:16 Portrait':fontsize=28:fontcolor=gray:x=(w-text_w)/2:y=h/2+80" -c:v libx264 -pix_fmt yuv420p -y "%OUTDIR%\test_vertical_%FILE_TS%.mp4" 2>nul
if !errorlevel!==0 (
    echo   -^> test_vertical_%FILE_TS%.mp4 [OK]
) else (
    echo   -^> Failed!
)

echo.
echo Done!
endlocal
