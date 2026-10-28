export interface ForwardRequest {
  id: string
  reqId: string
  reqTitle: string
  clientName: string
  recruiterName: string
  recruiterEmail: string
  candidateNames: string[]
  requestedAt: string
  status: 'pending' | 'approved' | 'rejected'
  toRecipients: string[]
  ccRecipients: string[]
  bccRecipients: string[]
  reviewedBy?: string
  reviewedAt?: string
}


let forwardMemory: ForwardRequest[] = []

export function getForwardRequests(): ForwardRequest[] {
  return forwardMemory
}

export function getForwardRequestByReq(reqId: string): ForwardRequest | undefined {
  const requests = getForwardRequests()
  return requests.find(r => r.reqId === reqId)
}

export function createOrUpdateForwardRequest(
  reqId: string,
  reqTitle: string,
  clientName: string,
  recruiterName: string,
  recruiterEmail: string,
  candidateNames: string[],
  toRecipients: string[] = [],
  ccRecipients: string[] = [],
  bccRecipients: string[] = []
): ForwardRequest {
  const requests = getForwardRequests()
  const existing = requests.find(r => r.reqId === reqId)

  if (existing) {
    if (existing.status === 'approved') {
      return existing
    }
    const updated = requests.map(r =>
      r.reqId === reqId
        ? {
            ...r,
            status: 'pending' as const,
            requestedAt: 'Just now',
            candidateNames: candidateNames.length > 0 ? candidateNames : r.candidateNames,
          }
        : r
    )
    forwardMemory = updated
    window.dispatchEvent(new CustomEvent('forward_requests_updated'))
    return updated.find(r => r.reqId === reqId)!
  }

  const newReq: ForwardRequest = {
    id: `FREQ-${Date.now().toString().slice(-4)}`,
    reqId,
    reqTitle,
    clientName,
    recruiterName,
    recruiterEmail,
    candidateNames,
    requestedAt: 'Just now',
    status: 'pending',
    toRecipients,
    ccRecipients,
    bccRecipients,
  }

  const nextList = [newReq, ...requests]
  forwardMemory = nextList
  window.dispatchEvent(new CustomEvent('forward_requests_updated'))
  return newReq
}

export function approveForwardRequest(requestId: string, reviewerName = 'Team Lead'): ForwardRequest | null {
  const requests = getForwardRequests()
  let updatedReq: ForwardRequest | null = null

  const nextList = requests.map(r => {
    if (r.id === requestId || r.reqId === requestId) {
      updatedReq = {
        ...r,
        status: 'approved' as const,
        reviewedBy: reviewerName,
        reviewedAt: 'Just now',
      }
      return updatedReq
    }
    return r
  })

  forwardMemory = nextList
  window.dispatchEvent(new CustomEvent('forward_requests_updated'))
  return updatedReq
}

export function rejectForwardRequest(requestId: string, reviewerName = 'Team Lead'): ForwardRequest | null {
  const requests = getForwardRequests()
  let updatedReq: ForwardRequest | null = null

  const nextList = requests.map(r => {
    if (r.id === requestId || r.reqId === requestId) {
      updatedReq = {
        ...r,
        status: 'rejected' as const,
        reviewedBy: reviewerName,
        reviewedAt: 'Just now',
      }
      return updatedReq
    }
    return r
  })

  forwardMemory = nextList
  window.dispatchEvent(new CustomEvent('forward_requests_updated'))
  return updatedReq
}
