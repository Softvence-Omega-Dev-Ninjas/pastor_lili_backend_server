import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private chatService: ChatService) {}

  handleConnection(client: Socket) {
    // clients should send 'join' event with userId after connecting
  }

  handleDisconnect(client: Socket) {}

  @SubscribeMessage('join')
  handleJoin(@MessageBody() payload: { userId: string }, @ConnectedSocket() client: Socket) {
    client.join(payload.userId);
    return { joined: payload.userId };
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() payload: { senderId: string; receiverId: string; content: string }, @ConnectedSocket() client: Socket) {
    const message = await this.chatService.saveMessage(payload);
    client.to(payload.receiverId).emit('message', message);
    return message;
  }
}
