import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({ namespace: '/chat', cors: { origin: ["*", "http://localhost:3001"] } })
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  server: any;
  constructor(private chatService: ChatService) { }
  afterInit(server: Server) {
    console.log('✅ Chat WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (!userId) {
      console.log("Client connected without userId, disconnecting")
      client.disconnect(true);
      return
    }

    client.join(userId)
    console.log(`Client connected : ${client.id} (User: ${userId})`);
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    console.log(`Client disconnected: ${client.id} (User: ${userId})`)
  }

  // @SubscribeMessage('join')
  // handleJoin(@MessageBody() payload: { userId: string }, @ConnectedSocket() client: Socket) {
  //   console.log(payload)
  //   client.join(payload.userId);
  //   return { joined: payload.userId };
  // }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { senderId: string; receiverId: string; content: string },
    @ConnectedSocket() client: Socket) {
    const { senderId, receiverId, content } = data;

    const saveMessage = await this.chatService.saveMessage({
      senderId,
      receiverId,
      content,
    })

    this.server.to(receiverId).emit('receive_message', saveMessage);
    this.server.to(senderId).emit('receive_message', saveMessage)
    // const message = await this.chatService.saveMessage(payload);
    // client.to(payload.receiverId).emit('message', message);
    // return message;
  }
}
