import { Types } from 'mongoose';

export type RoleType = 'superadmin' | 'admin' | 'lead' | 'recruiter' | 'devteam' | 'client';

export interface CurrentUserPayload {
  userId: string;
  _id: Types.ObjectId;
  orgId: Types.ObjectId;
  email: string;
  name: string;
  role: RoleType;
  teamId?: Types.ObjectId;
  teamRecruiterIds?: Types.ObjectId[];
  clientId?: Types.ObjectId;
}
