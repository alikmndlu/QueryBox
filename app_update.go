package main

import (
	"context"
	"time"

	"querybox/internal/updater"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func (a *App) GetAppVersion() string {
	return updater.DisplayVersion()
}

func (a *App) CheckForUpdate() (updater.Info, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	info, err := updater.Check(ctx)
	return info, err
}

func (a *App) InstallUpdate() (updater.Result, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()
	info, err := updater.Check(ctx)
	if err != nil {
		return updater.Result{}, err
	}
	res, err := updater.Install(ctx, info, func(p updater.Progress) {
		if a.ctx != nil {
			runtime.EventsEmit(a.ctx, "update:progress", p)
		}
	})
	if err != nil {
		return res, err
	}
	if res.RestartRequired {
		go func() {
			time.Sleep(400 * time.Millisecond)
			if a.ctx != nil {
				runtime.Quit(a.ctx)
			}
		}()
	}
	return res, nil
}

func (a *App) OpenReleasePage() {
	if a.ctx == nil {
		return
	}
	runtime.BrowserOpenURL(a.ctx, "https://github.com/"+updater.GitHubOwner+"/"+updater.GitHubRepo+"/releases/latest")
}
