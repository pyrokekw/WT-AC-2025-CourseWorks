import { Schema, model } from 'mongoose'

const HEX_COLOR_REGEX = /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/

const normalizeHex = (value: unknown) => {
    if (typeof value !== 'string') return value
    const v = value.trim()
    if (!v) return v
    return v.startsWith('#') ? v : `#${v}`
}

const TagSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
            maxlength: 64,
            lowercase: true,
            unique: true,
            index: true,
        },
        color: {
            type: String,
            required: true,
            trim: true,
            set: normalizeHex,
            validate: {
                validator: (v: string) => HEX_COLOR_REGEX.test(v),
                message: 'color must be a valid hex like #AABBCC or #ABC',
            },
        },
    },
    { timestamps: true }
)

TagSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: any) => {
        ret.id = String(ret._id)
        delete ret._id
    },
})

export const TagModel = model('Tag', TagSchema)
