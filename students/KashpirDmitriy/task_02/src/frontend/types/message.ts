export type ChatMessage = {
  id: number
  senderId: number
  chatId: number
  text: string
  created: string
}

export type SendMessagePayload = {
  senderId: number
  chatId: number
  text: string
  created?: string
}
