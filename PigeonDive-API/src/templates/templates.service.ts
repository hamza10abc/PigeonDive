import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTemplateDto, UpdateTemplateDto } from "./templates.dto";

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.template.findMany({ orderBy: { updatedAt: "desc" } });
  }

  async get(id: string) {
    const template = await this.prisma.template.findUnique({ where: { id } });
    if (!template) throw new NotFoundException("Template not found");
    return template;
  }

  create(input: CreateTemplateDto) {
    return this.prisma.template.create({ data: input });
  }

  async update(id: string, input: UpdateTemplateDto) {
    await this.get(id);
    return this.prisma.template.update({ where: { id }, data: input });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.template.delete({ where: { id } });
    return { deleted: true };
  }
}
