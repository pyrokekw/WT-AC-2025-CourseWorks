import { InferSchemaType, model, Model, models, Schema } from 'mongoose'

const ProjectCollectionSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        cover: { type: String, default: '' },
        projects: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Project',
                default: [],
            },
        ],
    },
    { timestamps: true }
)

ProjectCollectionSchema.index({ name: 1 }, { unique: true })

type ProjectCollection = InferSchemaType<typeof ProjectCollectionSchema>

export const ProjectCollectionModel: Model<ProjectCollection> =
    (models.ProjectCollection as Model<ProjectCollection>) ||
    model<ProjectCollection>('ProjectCollection', ProjectCollectionSchema)
