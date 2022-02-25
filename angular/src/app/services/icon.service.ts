import { Injectable } from '@angular/core';

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
