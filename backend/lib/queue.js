// In-memory queue placeholder. Replace with Redis/BullMQ in production.
const queue = []
export function enqueue(task) { queue.push(task) }
export function drain(handler) {
  setInterval(async () => {
    if (queue.length === 0) return
    const task = queue.shift()
    try { await handler(task) } catch (e) { console.error('Queue error', e) }
  }, 1000)
}
