package main

import (
	_ "embed"

	"github.com/energye/systray"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed build/appicon.png
var defaultTrayIcon []byte

func (a *App) setupTray() {
	go systray.Run(func() {
		if len(defaultTrayIcon) > 0 {
			systray.SetIcon(defaultTrayIcon)
		}
		systray.SetTitle("QueryBox")
		systray.SetTooltip("QueryBox — SQL Query Manager")

		mShow := systray.AddMenuItem("Show QueryBox", "Bring QueryBox to front")
		mShow.Click(func() {
			if a.ctx != nil {
				runtime.WindowShow(a.ctx)
				runtime.WindowUnminimise(a.ctx)
			}
		})

		mNew := systray.AddMenuItem("New Query", "Create a new SQL query")
		mNew.Click(func() {
			if a.ctx != nil {
				runtime.WindowShow(a.ctx)
				runtime.WindowUnminimise(a.ctx)
				runtime.EventsEmit(a.ctx, "tray:new-query")
			}
		})

		mSettings := systray.AddMenuItem("Settings", "Open application settings")
		mSettings.Click(func() {
			if a.ctx != nil {
				runtime.WindowShow(a.ctx)
				runtime.WindowUnminimise(a.ctx)
				runtime.EventsEmit(a.ctx, "tray:open-settings")
			}
		})

		systray.AddSeparator()

		mQuit := systray.AddMenuItem("Quit QueryBox", "Quit application")
		mQuit.Click(func() {
			systray.Quit()
			if a.ctx != nil {
				runtime.Quit(a.ctx)
			}
		})

		systray.SetOnClick(func(menu systray.IMenu) {
			if a.ctx != nil {
				runtime.WindowShow(a.ctx)
				runtime.WindowUnminimise(a.ctx)
			}
		})
	}, func() {
		// onExit cleanup
	})
}
