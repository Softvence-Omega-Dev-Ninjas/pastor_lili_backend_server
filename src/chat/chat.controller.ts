import { Controller, Get } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { ApiOperation } from "@nestjs/swagger";
import { GetUser } from "src/common/decorators/get-user.decorator";

@Controller('chat')
export class ChatController {
    constructor ( private readonly chatService: ChatService){}

    // Get all messages for a user (their entire history)
    @Get('history/user')
    @ApiOperation({summary: "Get all messages for a user"})
    async getUserChatHistory(@GetUser('id') userId:string){
           return this.chatService.getMessagesByUser(userId)
    }

}