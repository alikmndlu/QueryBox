//go:build windows

package updater

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"

	"golang.org/x/sys/windows/registry"
)

const createNoWindow = 0x08000000

func replaceRunning(newBinary, version string) error {
	current, err := os.Executable()
	if err != nil {
		return fmt.Errorf("unable to locate the running app")
	}
	if resolved, err := filepath.EvalSymlinks(current); err == nil {
		current = resolved
	}
	if !dirWritable(filepath.Dir(current)) {
		return notWritableError()
	}
	syncUninstallDisplayVersion(version)

	pid := strconv.Itoa(os.Getpid())
	script := filepath.Join(filepath.Dir(newBinary), "apply-update.bat")
	body := "@echo off\r\n" +
		"setlocal enabledelayedexpansion\r\n" +
		"set \"TARGET=" + current + "\"\r\n" +
		"set \"SOURCE=" + newBinary + "\"\r\n" +
		"set \"APP_PID=" + pid + "\"\r\n" +
		"\r\n" +
		":wait_process\r\n" +
		"timeout /t 1 /nobreak >nul\r\n" +
		"taskkill /F /PID %APP_PID% >nul 2>nul\r\n" +
		"\r\n" +
		"set /a N=0\r\n" +
		":copy_retry\r\n" +
		"copy /Y \"%SOURCE%\" \"%TARGET%\" >nul 2>nul\r\n" +
		"if not errorlevel 1 goto launch_app\r\n" +
		"timeout /t 1 /nobreak >nul\r\n" +
		"set /a N+=1\r\n" +
		"if %N% LSS 15 goto copy_retry\r\n" +
		"\r\n" +
		":launch_app\r\n" +
		"if exist \"%SOURCE%\" del /f /q \"%SOURCE%\" >nul 2>nul\r\n" +
		"start \"\" \"%TARGET%\"\r\n" +
		"(goto) 2>nul & del \"%~f0\"\r\n"

	if err := os.WriteFile(script, []byte(body), 0o700); err != nil {
		return fmt.Errorf("unable to schedule the update")
	}
	cmd := exec.Command("cmd.exe", "/C", script)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow:    true,
		CreationFlags: createNoWindow | syscall.CREATE_NEW_PROCESS_GROUP,
	}
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("unable to start the updater")
	}
	_ = cmd.Process.Release()
	return nil
}

func syncUninstallDisplayVersion(version string) {
	v := strings.TrimPrefix(DisplayVersionFrom(version), "v")
	if v == "" {
		return
	}
	k, err := registry.OpenKey(registry.CURRENT_USER, `Software\Microsoft\Windows\CurrentVersion\Uninstall\QueryBox`, registry.SET_VALUE)
	if err != nil {
		return
	}
	defer k.Close()
	_ = k.SetStringValue("DisplayVersion", v)
}
