import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable, NgZone } from '@angular/core';
import { Account, Persisted, Wallet } from '../interfaces';
import { MINUTE } from '../shared/constants';
import { Router } from '@angular/router';
import { CommunicationService } from './communication.service';
import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs';
import { Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class IconService {
    icons = [
        'account_circle',
        'perm_identity',
        'savings',
        'account_balance',
        'pets',
        'work_outline',
        'star_rate',
        'verified_user',
        'people',
        'family_restroom',
        'sentiment_satisfied',
        'sentiment_very_satisfied',
        'self_improvement',
        'home',
        'folder',
        'cloud',
        'restaurant',
        'flight',
        'handyman',
        'light_mode',
        'dark_mode',
        'info',
        'check_circle',
        'shopping_cart',
        'shop',
        'visibility',
        'favorite',
        'favorite_border',
        'face',
        'fingerprint',
        'verified',
        'lightbulb',
        'paid',
        'loyalty',
        'privacy_tip',
        'bookmark'];
    default = 'account_circle';
}
