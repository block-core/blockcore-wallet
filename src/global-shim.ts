// Needed for BIP39 and likely more.
(window as any)['global'] = window;

import * as buffer from 'buffer';
(window as any).Buffer = buffer.Buffer;
