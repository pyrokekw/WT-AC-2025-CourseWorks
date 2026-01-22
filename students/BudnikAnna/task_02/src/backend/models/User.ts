import mongoose, { Schema, InferSchemaType, Model } from 'mongoose'
import bcrypt from 'bcrypt'

export type UserRole = 'user' | 'admin'

const emailRegex =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/i

const UserSchema = new Schema(
    {
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
            required: true,
            index: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 80,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
            lowercase: true,
            validate: {
                validator: (v: string) => emailRegex.test(v),
                message: 'Invalid email format',
            },
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
            select: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: {
            transform: (_doc, ret) => {
                delete ret.password
                return ret
            },
        },
        toObject: {
            transform: (_doc, ret) => {
                delete ret.password
                return ret
            },
        },
    }
)

UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10)
    this.password = await bcrypt.hash(this.password, saltRounds)
})

UserSchema.methods.comparePassword = async function (plain: string) {
    return bcrypt.compare(plain, this.password)
}

export type UserDoc = InferSchemaType<typeof UserSchema> & {
    comparePassword(plain: string): Promise<boolean>
}

export const UserModel: Model<UserDoc> =
    mongoose.models.User || mongoose.model<UserDoc>('User', UserSchema)
