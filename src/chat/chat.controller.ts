import { Controller, Delete, Get, Param, UseGuards } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { GetUser } from "src/common/decorators/get-user.decorator";
import { JwtAuthGuard } from "src/common/guards/jwt.guard";
import { handleRequest } from "src/common/utils/handle.request";

@ApiTags("Chat")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    // Get all messages for a user (their entire history)
    @Get('history/user')
    @ApiOperation({ summary: "Get all messages for a user" })
    async getUserChatHistory(@GetUser('id') userId: string) {
        console.log("User", userId)
        return handleRequest(
            () => this.chatService.getMessagesByUser(userId),
            ' Get all messages for a user successfully',
        );
    }

    //  Get all messages between two users
    @Get('history/:userB')
    @ApiOperation({ summary: 'Get all messages between you and another users' })
    // @ApiParam({ name: 'partnerId', description: 'User B ID' })
    async getMessagesBetweenUsers( @GetUser('id') userA:string, @Param('userB') userB: string) {
        return handleRequest(
            () => this.chatService.getMessagesBetweenUsers(userA, userB),
            'Get all messages between two users successfully',
        );
    }

    //  Get all chat partners for a user (unique users you have chatted with)
    @Get('partners')
    @ApiOperation({ summary: 'Get all chat partners for a user' })
    async getChatPartners(@GetUser('id') userId: string) {
        return handleRequest(
            () => this.chatService.getChatPartnersWithUser(userId),
            'Get all chat partners for a user successfully',
        );
    }

    // Delete A Message by Id..
    @Delete('removeMessage/:messageId')
    async removeMessage(@GetUser('id') userId: string, @Param('messageId') messageId: string) {
        return handleRequest(
            () => this.chatService.removeMessage(userId, messageId),
            'delete message successfully',
        );
    }
}