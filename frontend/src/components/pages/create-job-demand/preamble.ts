import React, { useState } from 'react'
import { ArrowLeft, Upload, FileText, Plus, X, Sparkles } from 'lucide-react'
import { Requirement } from '../../../types'

export interface CreateJobDemandFormProps {
  onCancel: () => void
  onSubmit: (newReq: Requirement) => void
  userRole?: string
  mode?: 'create' | 'edit'
  initialData?: Requirement | null
}
