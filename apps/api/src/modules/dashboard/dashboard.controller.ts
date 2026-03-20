import { Controller, Get } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { Roles } from "../../auth/decorators/index";
import { UserRole } from "@sisvac/types";

@Controller("dashboard")
@Roles(UserRole.ADMIN, UserRole.RH)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get("kpis")
  getKpis() {
    return this.service.getKpis();
  }
}
