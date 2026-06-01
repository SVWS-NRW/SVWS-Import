let counter = 0
export function generateId(): string {
  return `row-${Date.now()}-${++counter}`
}
