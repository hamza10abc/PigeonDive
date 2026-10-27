import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateTemplateDto, UpdateTemplateDto } from "./templates.dto";
import { TemplatesService } from "./templates.service";

@Controller("templates")
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get()
  list() {
    return this.templates.list();
  }

  @Get(":id")
  get(@Param("id", ParseUUIDPipe) id: string) {
    return this.templates.get(id);
  }

  @Post()
  create(@Body() input: CreateTemplateDto) {
    return this.templates.create(input);
  }

  @Put(":id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() input: UpdateTemplateDto) {
    return this.templates.update(id, input);
  }

  @Delete(":id")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.templates.remove(id);
  }
}
