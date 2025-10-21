import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketServer } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { ChatService } from './chat.service';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/lib/prisma/prisma.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
@Injectable()
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private logger = new Logger('ChatGateway');
  constructor(
    private readonly chatService: ChatService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  // ----------------
  // Server Initialization
  // -----------------

  afterInit(server: Server) {
    console.log('Chat WebSocket Gateway initialized');
  }

  // -------------------
  // Handle New Connection 
  // -------------------

  async handleConnection(client: Socket) {
    try {
      const token = this.extractTokenFromSocket(client);
      if (!token) return this.disconnectWithError(client, 'Missing token')

      const payload = this.jwtService.verify(token, {
        secret: this.configService.getOrThrow('JWT_SECRET')
      })

      if (!payload.sub) return this.disconnectWithError(client, 'Invalid token payload')

      // fetch user from db.
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          fullName: true,
          avatar: true
        },
      });

      if (!user) return this.disconnectWithError(client, "User not found")

      // Attach user info to chat
      client.data.user = user.id,
        client.data.user = user;

      //  join private user
      client.join(user.id);

      this.logger.log(`User connected : ${user.id} (socket ${client.id})`);
      client.emit('connection_success', { message: 'Connected successfully', user })
    } catch (error) {
      this.disconnectWithError(client, error?.message ?? 'Authentication failed');
    }
  }

  // --------------------------
  //  Handle Disconnection
  // --------------------------
  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      client.leave(userId);
      this.logger.log(` user disconnected: ${userId}`);
    } else {
      this.logger.log(` unauthenticated socket disconnected (${client.id})`);
    }
  }

  // --------------------------
  //  Extract Token from Query/Header
  // --------------------------
  private extractTokenFromSocket(client: Socket): string | null {
    try {
      // Preferred: pass token as query param OR header
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.query?.token as string) ||
        (client.handshake.headers?.authorization as string)?.split(' ')[1];
      return token || null;
    } catch {
      return null;
    }
  }
  // ----------------------
  // Disconnect with error function
  // ----------------------
  private disconnectWithError(client: Socket, message: string) {
    this.logger.warn(`disconnecting client: ${message}`);
    client.emit('error', { message });
    client.disconnect(true);
  }

  // -----------------
  // Send Message 
  // -----------------

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { senderId: string; receiverId: string; content: string, imageUrl?: string },
    @ConnectedSocket() client: Socket) {
    const { senderId, receiverId, content, imageUrl } = data;

    if (!senderId || !receiverId) {
      client.emit('error', { message: 'senderId and receiverId are required' });
      return;
    }
    const saveMessage = await this.chatService.saveMessage({
      senderId: senderId,
      receiverId: receiverId,
      content: content,
      imageUrl
    })

    // Send to both sender and receiver in real-time.
    this.server.to(receiverId).emit('receive_message', saveMessage);
    this.server.to(senderId).emit('receive_message', saveMessage)
  }


  // ------------------
  // Get All Message for a user
  // -------------------
  @SubscribeMessage('get_user_history')
  async getUserChatHistory(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId } = data;
    const messages = await this.chatService.getMessagesByUser(userId);
    client.emit('user_history', messages)
  }

  // --------------------
  // Get All Messages for a user
  // --------------------
  @SubscribeMessage('get_conversation')
  async getMessagesBetweenUsers(
    @MessageBody() data: { userA: string; userB: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { userA, userB } = data;
    const messages = await this.chatService.getMessagesBetweenUsers(userA, userB)
    client.emit('conversation', messages)
  }

  // -----------------
  // Get All chat partners
  // -----------------
  @SubscribeMessage('get_partners')
  async getChatPartners(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId } = data;
    const partners = await this.chatService.getChatPartnersWithUser(userId)
    client.emit('partners_list', partners)
  }

  // --------------
  // Delete a Message
  // ---------------
  @SubscribeMessage('delete_message')
  async removeMessage(
    @MessageBody() data: { userId: string, messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId, messageId } = data;
    const result = await this.chatService.removeMessage(userId, messageId)
    client.emit('message_deleted', { messageId, success: true })
  }

}
