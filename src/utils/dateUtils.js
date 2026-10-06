import { format, formatDistanceToNow, isPast, isFuture, isToday, parseISO } from 'date-fns'

export function formatEventDate(date) {
  if (!date) return ''
  const parsed = typeof date === 'string' ? parseISO(date) : date
  return format(parsed, 'EEEE, MMMM d, yyyy')
}

export function formatEventTime(time) {
  if (!time) return ''
  // time is HH:mm:ss from Postgres
  const [hours, minutes] = time.split(':')
  const date = new Date()
  date.setHours(parseInt(hours), parseInt(minutes))
  return format(date, 'h:mm a')
}

export function formatShortDate(date) {
  if (!date) return ''
  const parsed = typeof date === 'string' ? parseISO(date) : date
  return format(parsed, 'MMM d, yyyy')
}

export function formatRelativeTime(date) {
  if (!date) return ''
  const parsed = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(parsed, { addSuffix: true })
}

export function isEventPast(date, time) {
  if (!date) return false
  const dateTimeStr = `${date}T${time || '23:59:59'}`
  const eventDate = parseISO(dateTimeStr)
  return isPast(eventDate)
}

export function isEventToday(date) {
  if (!date) return false
  const parsed = typeof date === 'string' ? parseISO(date) : date
  return isToday(parsed)
}

export function isEventUpcoming(date, time) {
  if (!date) return false
  const dateTimeStr = `${date}T${time || '00:00:00'}`
  const eventDate = parseISO(dateTimeStr)
  return isFuture(eventDate)
}

export function getDayOfWeek(date) {
  if (!date) return ''
  const parsed = typeof date === 'string' ? parseISO(date) : date
  return format(parsed, 'EEE')
}

export function getDayNumber(date) {
  if (!date) return ''
  const parsed = typeof date === 'string' ? parseISO(date) : date
  return format(parsed, 'd')
}

export function getMonthYear(date) {
  if (!date) return ''
  const parsed = typeof date === 'string' ? parseISO(date) : date
  return format(parsed, 'MMM yyyy')
}
