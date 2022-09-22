import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SettingsService } from 'src/app/services';

@Component({
  selector: 'app-language-selector',
  templateUrl: './language-selector.component.html',
})
export class LanguageSelectorComponent {
  constructor(public translate: TranslateService, private settingsService: SettingsService) {}

  async onLanguageChanged(language: string) {
    this.settingsService.setLanguage(language);
    this.settingsService.values.language = language;
    await this.settingsService.save();
  }
}
