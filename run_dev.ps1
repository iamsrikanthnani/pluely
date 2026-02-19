# Load VS Developer Environment
$vsDevCmd = "C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\Tools\VsDevCmd.bat"
if (Test-Path $vsDevCmd) {
    Write-Host "Loading Visual Studio Developer Environment..."
    $envVars = cmd.exe /c "`"$vsDevCmd`" -arch=amd64 >nul 2>&1 && set" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            [PSCustomObject]@{ Name = $matches[1]; Value = $matches[2] }
        }
    }
    foreach ($var in $envVars) {
        Set-Item -Path "Env:\$($var.Name)" -Value $var.Value
    }
    Write-Host "VS Environment loaded."
} else {
    Write-Host "WARNING: VsDevCmd.bat not found!"
}

# Also refresh user PATH
$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User') + ';' + $env:Path

# Verify
Write-Host "Node: $(node --version)"
Write-Host "Rust: $(rustc --version)"
Write-Host "Link: $(where.exe link.exe 2>&1 | Select-Object -First 1)"

Set-Location "C:\Users\futur\Downloads\iCloudDrive\Codebase\pluely"
Write-Host "`nInstalling npm dependencies..."
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "`nStarting Tauri dev server (first build may take several minutes)..."
    npm run tauri dev
} else {
    Write-Host "npm install failed with exit code $LASTEXITCODE"
}
