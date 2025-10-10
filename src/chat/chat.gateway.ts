import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketServer } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({cors: { origin: ["*", "http://localhost:3001"] } })
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server:Server;
  constructor(private chatService: ChatService) { }

  afterInit(server: Server) {
    console.log('✅ Chat WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (!userId) {
      // console.log("Client connected without userId, disconnecting")
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

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: {  senderId: string; reciverId: string; message: string },
    @ConnectedSocket() client: Socket) {
    const { senderId, reciverId, message } = data;
    // console.log(data)
    const saveMessage = await this.chatService.saveMessage({
      senderId:senderId,
      receiverId:reciverId,
      content:message,
    })

    this.server.to(reciverId).emit('receive_message', saveMessage);
    this.server.to(senderId).emit('receive_message', saveMessage)
  }
}
