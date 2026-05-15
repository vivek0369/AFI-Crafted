import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  client: string;
  calcType: string;
  entries: {
    name: string;
    length: number;
    girth?: number;
    width?: number;
    thickness?: number;
    nos: number;
    rate: number;
    allowance?: number;
    unit: string;
    volume: number;
    value: number;
  }[];
  totalVolume: number;
  totalValue: number;
  unit: string;
  date: Date;
  status: string;
  discount?: number;
  tax?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  client: { type: String, required: true },
  calcType: { type: String, required: true },
  entries: [{
    name: { type: String, required: true },
    length: { type: Number, required: true },
    girth: { type: Number },
    width: { type: Number },
    thickness: { type: Number },
    nos: { type: Number, required: true },
    rate: { type: Number, required: true },
    allowance: { type: Number },
    unit: { type: String, required: true },
    volume: { type: Number, required: true },
    value: { type: Number, required: true },
  }],
  totalVolume: { type: Number, required: true },
  totalValue: { type: Number, required: true },
  unit: { type: String, required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['Draft', 'Final'], default: 'Draft' },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<IReport>('Report', ReportSchema);
