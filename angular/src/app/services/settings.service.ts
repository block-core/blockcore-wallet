import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { str } from '@scure/base';
import { SettingStore } from 'src/shared';
import { Settings } from '../../shared/interfaces';
import { UIState } from './ui-state.service';
import { Direction } from '@angular/cdk/bidi';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private renderer: Renderer2;

  constructor(private settingStore: SettingStore, public translate: TranslateService, private uiState: UIState, @Inject(DOCUMENT) private document: Document, private rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  get values(): Settings {
    return this.settingStore.get();
  }

  async replace(settings: Settings) {
    this.settingStore.set(settings);
    await this.settingStore.save();
  }

  async save() {
    await this.settingStore.save();
  }

  async update() {
    // Make sure we first load latest from storage
    await this.settingStore.load();

    if (this.values.theme === 'light') {
      this.renderer.removeClass(document.body, 'dark-theme');
    } else {
      this.renderer.addClass(document.body, 'dark-theme');
    }

    this.setLanguage(this.values.language);
  }

  setTheme(theme: string) {
    if (theme === 'light') {
      this.renderer.removeClass(document.body, 'dark-theme');
    } else {
      this.renderer.addClass(document.body, 'dark-theme');
    }

    this.values.theme = theme;
  }

  setLanguage(language: string) {
    this.values.language = language;
    this.translate.use(language);

    const rtlLanguages: string[] = ['ar', 'fa', 'he'];

    if (rtlLanguages.includes(language)) {
      this.uiState.documentDirection = 'rtl';
      this.values.dir = 'rtl';
    } else {
      this.uiState.documentDirection = 'ltr';
      this.values.dir = 'ltr';
    }
  }
}