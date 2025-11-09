
import { ActionType } from './types';

export const GRADES = [
    "الصف الخامس",
    "الصف السادس",
    "الصف السابع",
    "الصف الثامن",
    "الصف التاسع",
    "الصف العاشر"
];

export const ACTION_TYPES: ActionType[] = [
    'مغادرة', 'تنبيه', 'إنذار', 'استدعاء ولي أمر', 'مخالفة', 'تأخير', 'تبليغ غياب'
];

export const ACTION_BADGE_CLASSES: Record<ActionType, string> = {
    'مغادرة': 'bg-yellow-400 text-yellow-900',
    'تنبيه': 'bg-blue-400 text-blue-900',
    'إنذار': 'bg-red-500 text-white',
    'استدعاء ولي أمر': 'bg-purple-500 text-white',
    'مخالفة': 'bg-red-700 text-white',
    'تأخير': 'bg-orange-400 text-orange-900',
    'تبليغ غياب': 'bg-pink-500 text-white'
};
