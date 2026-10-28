/**
 * Masks email address to match screenshot format:
 * e.g., "ankit.kumar@gmail.com" -> "an**********@gmail.com"
 * e.g., "saurabh.wankhede@gmail.com" -> "sp**********@gmail.com"
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email || ''
  const parts = email.split('@')
  const user = parts[0]
  const domain = parts[1]
  const prefix = user.length >= 2 ? user.slice(0, 2) : user[0]
  const maskLength = Math.max(user.length, 10)
  return `${prefix}${'*'.repeat(maskLength)}@${domain}`
}

/**
 * Masks phone number to match screenshot format:
 * e.g., "+91 9820001817" -> "********1817"
 * e.g., "9820003455" -> "******3455"
 */
export function maskPhone(phone: string): string {
  if (!phone) return '********1817'
  const digits = phone.replace(/\D/g, '')
  if (digits.length >= 4) {
    const lastFour = digits.slice(-4)
    const starCount = Math.max(digits.length - 4, 6)
    return `${'*'.repeat(starCount)}${lastFour}`
  }
  return '********1817'
}
