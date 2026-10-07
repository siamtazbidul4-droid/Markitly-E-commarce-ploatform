import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  actor: string;
  action: string;
  resource: string;
  details: string;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: String, required: true },
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true, index: true },
    details: { type: String, required: true },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

export const AuditLog = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
