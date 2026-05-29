import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../../shared/guards/super-admin.guard';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { User } from '../entities/user.entity';
import { UsersService } from '../services/users.service';

type SafeUser = Omit<User, 'passwordHash'>;

interface AuthedRequest {
  user: { sub: string };
}

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOkResponse({ description: 'Returns the currently authenticated user.' })
  async me(@Req() req: AuthedRequest): Promise<SafeUser | null> {
    const user = await this.usersService.findById(req.user.sub);
    if (!user) {
      return null;
    }
    return this.usersService.sanitize(user);
  }

  @Get()
  @ApiOkResponse({ type: [UserResponseDto] })
  async findAll(): Promise<SafeUser[]> {
    const users = await this.usersService.findAll();
    return users.map((u) => this.usersService.sanitize(u));
  }

  @Get(':id')
  @ApiOkResponse({ type: UserResponseDto })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<SafeUser> {
    const user = await this.usersService.findByIdOrFail(id);
    return this.usersService.sanitize(user);
  }

  @Post()
  @UseGuards(SuperAdminGuard)
  @ApiCreatedResponse({ type: UserResponseDto })
  async create(@Body() dto: CreateUserDto, @Req() req: AuthedRequest): Promise<SafeUser> {
    const user = await this.usersService.createFromDto(dto, req.user.sub);
    return this.usersService.sanitize(user);
  }

  @Patch(':id')
  @UseGuards(SuperAdminGuard)
  @ApiOkResponse({ type: UserResponseDto })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: AuthedRequest,
  ): Promise<SafeUser> {
    const user = await this.usersService.update(id, dto, req.user.sub);
    return this.usersService.sanitize(user);
  }

  @Delete(':id')
  @UseGuards(SuperAdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthedRequest,
  ): Promise<void> {
    return this.usersService.remove(id, req.user.sub);
  }
}
