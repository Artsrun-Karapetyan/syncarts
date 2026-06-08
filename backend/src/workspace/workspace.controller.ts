import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Request, Inject } from '@nestjs/common';
import * as fs from 'fs';
import { WorkspaceService } from './workspace.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { z } from 'zod';

const CreateWorkspaceSchema = z.object({
  name: z.string().min(1)
});

@Controller('workspaces')
@UseGuards(AuthGuard)
export class WorkspaceController {
  constructor(@Inject(WorkspaceService) private readonly workspaceService: WorkspaceService) {}

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    const { name } = CreateWorkspaceSchema.parse(body);
    return this.workspaceService.createWorkspace(name, req.authUser.id);
  }

  @Get()
  async findAll(@Request() req: any) {
    return this.workspaceService.getWorkspacesForUser(req.authUser.id);
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    // Basic auth check already happens in service for sync, but for GET let's filter the findAll array
    const workspaces = await this.workspaceService.getWorkspacesForUser(req.authUser.id);
    const workspace = workspaces.find((w: any) => w.id === id);
    if (!workspace) throw new Error('Workspace not found or unauthorized');
    return workspace;
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.workspaceService.deleteWorkspace(id, req.authUser.id);
  }

  @Put(':id/sync')
  async syncData(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    try {
      return await this.workspaceService.syncWorkspace(id, body, req.authUser.id);
    } catch (err: any) {
      fs.writeFileSync('/tmp/sync_error.log', err.stack || err.message);
      console.error('SYNC ERROR:', err);
      throw err;
    }
  }
}
