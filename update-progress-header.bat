
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

:: Calculate percentage
set /a percent=(count*100)/total

:: Rewrite file with updated first line
(
    echo !count!/!total! ^(!percent!%%^) Possible
    more +1 "%file%"
) > "%file%.tmp"

move /y "%file%.tmp" "%file%" >nul

echo Updated: !count!/!total! (!percent!%%) Possible
endlocal