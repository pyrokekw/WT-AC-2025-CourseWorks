import { Schema, model } from 'mongoose'

const ContactSchema = new Schema(
    {
        name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            maxlength: 200,
            unique: true,
            index: true,
        },
        message: { type: String, trim: true, maxlength: 4000 },

        isRead: { type: Boolean, default: false, index: true },

        meta: {
            ip: { type: String, trim: true },
            userAgent: { type: String, trim: true },
        },
    },
    { timestamps: true }
)

ContactSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: any) => {
        ret.id = String(ret._id)
        delete ret._id
    },
})

export const ContactModel = model('Contact', ContactSchema)
