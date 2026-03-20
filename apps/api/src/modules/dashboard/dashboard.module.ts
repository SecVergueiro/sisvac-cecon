import { Module } from '@nestjs/common'
import { DashboardController } from './dashboard.controller'
import { DashboardService } from './dashboard.service'
import { SupabaseService } from '../../config/supabase.service'

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, SupabaseService],
})
export class DashboardModule {}
