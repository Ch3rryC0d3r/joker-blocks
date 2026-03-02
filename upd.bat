setlocal EnableDelayedExpansion

set "file=joker-progress.txt"
set "total=150"
set /a count=0

:: Count checkmarks
for /f "usebackq delims=" %%A in ("%file%") do (
    echo %%A | find "✅" >nul
    if not errorlevel 1 (
        set /a count+=1
    )
)

:: Subtract 1 from count for display
set /a displayCount=count-1

:: Calculate percentage based on total
set /a percent=(displayCount*100)/total

:: Rewrite file with updated first line
(
    echo !displayCount!/!total! ^(!percent!%%^) Possible
    more +1 "%file%"
) > "%file%.tmp"

move /y "%file%.tmp" "%file%" >nul

echo Updated: !displayCount!/!total! (!percent!%%) Possible
endlocal