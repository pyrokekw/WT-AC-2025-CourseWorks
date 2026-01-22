import { Schema, model } from 'mongoose'

const ProjectSchema = new Schema(
    {
        name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
        description: { type: String, trim: true, maxlength: 4000 },

        imageUrl: { type: String, trim: true, maxlength: 2048, default: '' },

        stack: { type: [String], default: [] },
        tags: [{ type: Schema.Types.ObjectId, ref: 'Tag', default: [], index: true }],
    },
    { timestamps: true }
)

ProjectSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: any) => {
        ret.id = String(ret._id)
        delete ret._id
    },
})

export const ProjectModel = model('Project', ProjectSchema)
