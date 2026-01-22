export const INPUT_TYPES = [
    'button',
    'checkbox',
    'color',
    'date',
    'datetime-local',
    'email',
    'file',
    'hidden',
    'image',
    'month',
    'number',
    'password',
    'radio',
    'range',
    'reset',
    'search',
    'submit',
    'tel',
    'text',
    'time',
    'url',
    'week',
] as const

export type InputType = (typeof INPUT_TYPES)[number]

export const AUTOCOMPLETE_VALUES = [
    '',
    'on',
    'off',

    // identity
    'name',
    'given-name',
    'family-name',
    'nickname',
    'username',

    // contact
    'email',
    'tel',
    'tel-national',
    'tel-country-code',

    // auth
    'current-password',
    'new-password',
    'one-time-code',

    // address
    'organization',
    'organization-title',
    'street-address',
    'address-line1',
    'address-line2',
    'address-line3',
    'address-level1',
    'address-level2',
    'address-level3',
    'postal-code',
    'country',
    'country-name',

    // payment
    'cc-name',
    'cc-number',
    'cc-exp',
    'cc-exp-month',
    'cc-exp-year',
    'cc-csc',

    // misc
    'url',
    'photo',
    'bday',
    'bday-day',
    'bday-month',
    'bday-year',
    'sex',
    'language',
] as const

export type Autocomplete = (typeof AUTOCOMPLETE_VALUES)[number]
