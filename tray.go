package main

import (
	_ "embed"
	"runtime"

	"github.com/energye/systray"
	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed build/windows/icon.ico
var trayIconWindows []byte

//go:embed build/appicon.png
var trayIconPNG []byte

func getTrayIcon() []byte {
	if runtime.GOOS == "windows" {
		if len(trayIconWindows) > 0 {
			return trayIconWindows
		}
	}
	return trayIconPNG
}

func (a *App) setupTray() {
	go systray.Run(func() {
		icon := getTrayIcon()
		if len(icon) > 0 {
			systray.SetIcon(icon)
		}
		systray.SetTitle("QueryBox")
		systray.SetTooltip("QueryBox — SQL Query Manager")

		mShow := systray.AddMenuItem("Show QueryBox", "Bring QueryBox to front")
		mShow.Click(func() {
			if a.ctx != nil {
				wailsRuntime.WindowShow(a.ctx)
				wailsRuntime.WindowUnminimise(a.ctx)
			}
		})

		mNew := systray.AddMenuItem("New Query", "Create a new SQL query")
		mNew.Click(func() {
			if a.ctx != nil {
				wailsRuntime.WindowShow(a.ctx)
				wailsRuntime.WindowUnminimise(a.ctx)
				wailsRuntime.EventsEmit(a.ctx, "tray:new-query")
			}
		})

		mSettings := systray.AddMenuItem("Settings", "Open application settings")
		mSettings.Click(func() {
			if a.ctx != nil {
				wailsRuntime.WindowShow(a.ctx)
				wailsRuntime.WindowUnminimise(a.ctx)
				wailsRuntime.EventsEmit(a.ctx, "tray:open-settings")
			}
		})

		systray.AddSeparator()

		mQuit := systray.AddMenuItem("Quit QueryBox", "Quit application")
		mQuit.Click(func() {
			systray.Quit()
			if a.ctx != nil {
				wailsRuntime.Quit(a.ctx)
			}
		})

		systray.SetOnClick(func(menu systray.IMenu) {
			if a.ctx != nil {
				wailsRuntime.WindowShow(a.ctx)
				wailsRuntime.WindowUnminimise(a.ctx)
			}
		})
	}, func() {
		// onExit cleanup
	})
}
